import {
  bOrganizationContext,
  bResinPackageData,
  bResinPackageService,
} from '@bpcl/fabric';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { defer, lastValueFrom, retry } from 'rxjs';
import { In, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { ResinPackageCreatedEvent } from '../inventory/events/resin-package-created.event';
import { ResinDhopeService } from '../resin-dhope/resin-dhope.service';
import { CreateResinPackageDTO } from './dtos/create-resin-package.dto';
import { GetResinPackageDTO } from './dtos/get-resin-package.dto';
import { ResinPackageReportDTO } from './dtos/resin-package-report.dto';
import { ResinPackageResponseDTO } from './dtos/resin-package-response.dto';
import { ResinPackage } from './entities/resin-package.entity';
import { Status } from './enum/status.enum';

@Injectable()
export class ResinPackageService {
  constructor(
    @InjectRepository(ResinPackage)
    private resinPackageRepository: Repository<ResinPackage>,
    private companyService: CompanyService,
    private authService: AuthService,
    private resinDhopeService: ResinDhopeService,
    private bResinPackageService: bResinPackageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createResinPackageDto: CreateResinPackageDTO,
  ): Promise<ResinPackageResponseDTO[]> {
    const queryRunner =
      this.resinPackageRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await this.companyService.findById(
        createResinPackageDto.companyId,
      );

      await this.authService.findById(createResinPackageDto.userId);

      const resinDhope = await this.resinDhopeService.findById(
        createResinPackageDto.resinDhopeId,
      );

      let remainingResinDhope;
      if (createResinPackageDto.remainingResinDhopeId) {
        remainingResinDhope = await this.resinDhopeService.findById(
          createResinPackageDto.remainingResinDhopeId,
        );
      }

      // Weight already packaged from this resin dhope in previous (manual) calls
      const { alreadyPackagedWeight } = await queryRunner.manager
        .createQueryBuilder(ResinPackage, 'pkg')
        .select('COALESCE(SUM(pkg.packageWeight), 0)', 'alreadyPackagedWeight')
        .where('pkg.resinDhopeId = :resinDhopeId', {
          resinDhopeId: createResinPackageDto.resinDhopeId,
        })
        .getRawOne();

      const availableMainWeight =
        resinDhope.resinDhopeWeight - Number(alreadyPackagedWeight);

      let availableRemainingWeight = 0;
      if (createResinPackageDto.remainingResinDhopeId) {
        // Weight of the remaining resin dhope already merged into other packages.
        // remainingWeight is duplicated across every package created in the same
        // call, so dedupe by resinDhopeId before summing.
        const remainingUsageRows = await queryRunner.manager
          .createQueryBuilder(ResinPackage, 'pkg')
          .select('pkg.resinDhopeId', 'resinDhopeId')
          .addSelect('MAX(pkg.remainingWeight)', 'remainingWeight')
          .where('pkg.remainingResinDhopeId = :remainingResinDhopeId', {
            remainingResinDhopeId: createResinPackageDto.remainingResinDhopeId,
          })
          .groupBy('pkg.resinDhopeId')
          .getRawMany<{ resinDhopeId: number; remainingWeight: string }>();

        const alreadyUsedRemainingWeight = remainingUsageRows.reduce(
          (sum, row) => sum + (parseFloat(row.remainingWeight) || 0),
          0,
        );

        availableRemainingWeight =
          remainingResinDhope.resinDhopeWeight - alreadyUsedRemainingWeight;

        if (
          (createResinPackageDto.remainingWeight || 0) >
          availableRemainingWeight
        ) {
          throw new ConflictException(
            `Remaining weight exceeds the available weight (${availableRemainingWeight}kg) of resin dhope ${createResinPackageDto.remainingResinDhopeId}`,
          );
        }
      }

      const totalAvailableWeight =
        availableMainWeight + (createResinPackageDto.remainingWeight || 0);

      const requestedWeight = createResinPackageDto.packageWeights.reduce(
        (sum, weight) => sum + weight,
        0,
      );

      if (requestedWeight > totalAvailableWeight) {
        throw new ConflictException(
          `Requested package weight (${requestedWeight}kg) exceeds the available weight (${totalAvailableWeight}kg) of resin dhope ${createResinPackageDto.resinDhopeId}`,
        );
      }

      // Create one package per custom weight provided by the user
      const { packageWeights, ...packageData } = createResinPackageDto;
      const resinPackages: ResinPackage[] = packageWeights.map((weight) =>
        queryRunner.manager.create(ResinPackage, {
          ...packageData,
          packageWeight: weight,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: createResinPackageDto.userId,
          updatedBy: createResinPackageDto.userId,
        }),
      );

      const savedPackages = await queryRunner.manager.save(resinPackages);
      const createdPackageIds = savedPackages.map((pkg) => pkg.id);

      await this.saveToFabric(resinPackages, company);

      // Emit event here
      this.eventEmitter.emit(
        'resin-package.created',
        new ResinPackageCreatedEvent(
          company.id,
          savedPackages.length,
          requestedWeight,
        ),
      );

      await queryRunner.commitTransaction();

      const results = await this.resinPackageRepository.find({
        where: { id: In(createdPackageIds) },
        relations: [
          'resinDhope',
          // 'resinDhope.lot',
          // 'resinDhope.lot.lotPreproducts',
          // 'resinDhope.lot.lotPreproducts.preproduct',
          // 'resinDhope.lot.lotPreproducts.preproduct.batch',
          // 'resinDhope.lot.lotPreproducts.preproduct.batch.batchBales',
          // 'resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale',
          // 'resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale.company',
          'remainingResinDhope',
          // 'remainingResinDhope.lot',
          // 'remainingResinDhope.lot.lotPreproducts',
          // 'remainingResinDhope.lot.lotPreproducts.preproduct',
          // 'remainingResinDhope.lot.lotPreproducts.preproduct.batch',
          // 'remainingResinDhope.lot.lotPreproducts.preproduct.batch.batchBales',
          // 'remainingResinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale',
          // 'remainingResinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale.company',
        ],
      });

      if (!results) {
        throw new HttpException(
          'Failed to retrieve created resin package',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return results.map((resinPackage) =>
        plainToClass(ResinPackageResponseDTO, {
          ...resinPackage,
        }),
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByCompany(
    query: GetResinPackageDTO,
  ): Promise<ResinPackageResponseDTO[]> {
    const queryBuilder = this.resinPackageRepository
      .createQueryBuilder('resinPackage')
      .leftJoinAndSelect('resinPackage.resinDhope', 'resinDhope')
      // .leftJoinAndSelect('resinDhope.lot', 'lot')
      // .leftJoinAndSelect('lot.lotPreproducts', 'lotPreproducts')
      // .leftJoinAndSelect('lotPreproducts.preproduct', 'preproduct')
      // .leftJoinAndSelect('preproduct.batch', 'batch')
      // .leftJoinAndSelect('batch.batchBales', 'batchBales')
      // .leftJoinAndSelect('batchBales.bale', 'bale')
      // .leftJoinAndSelect('bale.company', 'company')
      .leftJoinAndSelect(
        'resinPackage.remainingResinDhope',
        'remainingResinDhope',
      )
      // .leftJoinAndSelect('remainingResinDhope.lot', 'remainingLot')
      // .leftJoinAndSelect(
      //   'remainingLot.lotPreproducts',
      //   'remainingLotPreproducts',
      // )
      // .leftJoinAndSelect(
      //   'remainingLotPreproducts.preproduct',
      //   'remainingPreproduct',
      // )
      // .leftJoinAndSelect('remainingPreproduct.batch', 'remainingBatch')
      // .leftJoinAndSelect('remainingBatch.batchBales', 'remainingBatchBales')
      // .leftJoinAndSelect('remainingBatchBales.bale', 'remainingBale')
      // .leftJoinAndSelect('remainingBale.company', 'remainingCompany')
      .orderBy('"resinPackage"."createdAt"', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"resinPackage"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"resinPackage"."createdAt" >= :startOfDay AND "resinPackage"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"resinPackage"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"resinPackage"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const resinPackages = await queryBuilder.getMany();

    return resinPackages.map((resinPackage) =>
      plainToClass(ResinPackageResponseDTO, {
        ...resinPackage,
      }),
    );
  }

  async getReport(query: GetResinPackageDTO): Promise<ResinPackageReportDTO> {
    const queryBuilder = this.resinPackageRepository
      .createQueryBuilder('resinPackage')
      .select('COUNT(resinPackage.id)', 'resinPackageQuantity');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
      queryBuilder.andWhere('resinPackage.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      queryBuilder.andWhere(
        'resinPackage.createdAt >= :startOfDay AND resinPackage.createdAt <= :endOfDay',
        { startOfDay, endOfDay },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('resinPackage.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('resinPackage.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const stats = await queryBuilder.getRawOne();

    return {
      resinPackageQuantity: parseFloat(stats.resinPackageQuantity) || 0,
    };
  }

  async findById(id: number): Promise<ResinPackageResponseDTO> {
    const resinPackage = await this.resinPackageRepository.findOne({
      where: { id },
      relations: [
        'resinDhope',
        // 'resinDhope.lot',
        // 'resinDhope.lot.lotPreproducts',
        // 'resinDhope.lot.lotPreproducts.preproduct',
        // 'resinDhope.lot.lotPreproducts.preproduct.batch',
        // 'resinDhope.lot.lotPreproducts.preproduct.batch.batchBales',
        // 'resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale',
        // 'resinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale.company',
        'remainingResinDhope',
        // 'remainingResinDhope.lot',
        // 'remainingResinDhope.lot.lotPreproducts',
        // 'remainingResinDhope.lot.lotPreproducts.preproduct',
        // 'remainingResinDhope.lot.lotPreproducts.preproduct.batch',
        // 'remainingResinDhope.lot.lotPreproducts.preproduct.batch.batchBales',
        // 'remainingResinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale',
        // 'remainingResinDhope.lot.lotPreproducts.preproduct.batch.batchBales.bale.company',
      ],
    });

    if (!resinPackage) {
      throw new NotFoundException(
        `Resin package with the given ID ${id} not found`,
      );
    }

    const resinDhope_1 = await this.resinDhopeService.findById(
      resinPackage.resinDhopeId,
    );

    let resinDhope_2;
    if (resinPackage.remainingResinDhope) {
      resinDhope_2 = await this.resinDhopeService.findById(
        resinPackage.remainingResinDhopeId,
      );
    }

    // Calculate Ocean bound percentage
    const resinDhope_1_BaleWeight: Record<string, number> = {};
    const resinDhope_2_BaleWeight: Record<string, number> = {};

    if (resinDhope_1.companyBaleWeights) {
      for (const [id, weight] of Object.entries(
        resinDhope_1.companyBaleWeights,
      )) {
        resinDhope_1_BaleWeight[id] =
          (resinDhope_1_BaleWeight[id] ?? 0) + weight;
      }
    }

    if (resinDhope_2 && resinDhope_2.companyBaleWeights) {
      for (const [id, weight] of Object.entries(
        resinDhope_2.companyBaleWeights,
      )) {
        resinDhope_2_BaleWeight[id] =
          (resinDhope_2_BaleWeight[id] ?? 0) + (weight as number);
      }
    }

    const resinDhope_1_totalBaleWeight = Object.values(
      resinDhope_1_BaleWeight,
    ).reduce((sum, w) => sum + w, 0);

    const resinDhope_2_totalBaleWeight = Object.values(
      resinDhope_2_BaleWeight,
    ).reduce((sum, w) => sum + w, 0);

    //Ocean bound (OB) weight in resin dhope 2
    let OBWeight_resinDhope_2 = 0;

    if (resinDhope_2 && resinDhope_2_totalBaleWeight > 0) {
      OBWeight_resinDhope_2 =
        (resinDhope_2_BaleWeight['2'] * resinPackage.remainingWeight) /
        resinDhope_2_totalBaleWeight;
    }

    //oceanBoundWeight = ((OB weight of resin dhope 1 + OB weight of remaining resin dhope 2) * package weight) / (Total Bale weight of resin dhope 1 and total remaining weight of resin dhope 2)
    const oceanBoundWeight = (
      ((resinDhope_1_BaleWeight['2'] + OBWeight_resinDhope_2) *
        resinPackage.packageWeight) /
      (resinDhope_1_totalBaleWeight +
        (resinDhope_2 ? resinPackage.remainingWeight : 0))
    ).toFixed(2);

    const oceanBoundPercentage = (
      (Number(oceanBoundWeight) * 100) /
      resinPackage.packageWeight
    ).toFixed(2);

    return plainToClass(ResinPackageResponseDTO, {
      ...resinPackage,
      oceanBoundWeight: oceanBoundWeight,
      oceanBoundPercentage: oceanBoundPercentage,
    });
  }

  private async saveToFabric(
    resinPackages: ResinPackage[],
    company: Company,
  ): Promise<void> {
    const resinPackageDataArray: bResinPackageData[] = resinPackages.map(
      (pkg) => ({
        id: pkg.id, // id
        resinDhopeId: pkg.resinDhopeId, // resinDhopeId
        remainingResinDhopeId: pkg.remainingResinDhopeId, // remainingResinDhopeId
        remainingWeight: pkg.remainingWeight, // remainingWeight
        productType: pkg.productType, // productType
        packageWeight: pkg.packageWeight, // packageWeight
        createdAt: pkg.createdAt, // createdAt
        createdBy: pkg.createdBy, // createdBy
        companyId: pkg.companyId, // companyId
        userId: pkg.userId, // userId
      }),
    );

    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: 'Org1',
    };

    // Process each package
    for (const packageData of resinPackageDataArray) {
      const deferred = defer(() =>
        this.bResinPackageService.createResinPackage(packageData, orgContext),
      ).pipe(retry({ count: 3, delay: 1000 }));
      await lastValueFrom(deferred);
    }
  }

  async updateResinPackageStatus(id: number): Promise<ResinPackageResponseDTO> {
    const resinPackage = await this.resinPackageRepository.findOne({
      where: { id },
    });

    if (!resinPackage) {
      throw new HttpException(
        `Resin package with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    resinPackage.status = Status.Shipped;
    resinPackage.updatedAt = new Date();

    const packages = await this.resinPackageRepository.save(resinPackage);

    return plainToClass(ResinPackageResponseDTO, packages);
  }
}
