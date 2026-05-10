import { bOrganizationContext, bPackagePreproductService } from '@bpcl/fabric';
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
import { PreproductPackageCreatedEvent } from '../inventory/events/preproduct-package-created.event';
import { GetPreproductDTO } from '../preproduct/dto/get-preproduct.dto';
import { PreproductService } from '../preproduct/preproduct.service';
import { CreatePreproductPackageDTO } from './dto/create-preproduct-package.dto';
import { GetPreproductPackageDTO } from './dto/get-preproduct-package.dto';
import { PreproductPackageReportDTO } from './dto/preproduct-package-report.dto';
import { PreproductPackageResponseDTO } from './dto/preproduct-package-response.dto';
import { PreproductPackage } from './entities/preproduct-package.entity';
import { Status } from './enum/status.enum';

@Injectable()
export class PreproductPackageService {
  constructor(
    @InjectRepository(PreproductPackage)
    private preproductPackageRepository: Repository<PreproductPackage>,
    private companyService: CompanyService,
    private authService: AuthService,
    private preproductService: PreproductService,
    private bPackagePreproductService: bPackagePreproductService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createPreproductPackageDto: CreatePreproductPackageDTO,
  ): Promise<PreproductPackageResponseDTO[]> {
    const queryRunner =
      this.preproductPackageRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await this.companyService.findById(
        createPreproductPackageDto.companyId,
      );

      await this.authService.findById(createPreproductPackageDto.userId);

      const preproduct = await this.preproductService.findById(
        createPreproductPackageDto.preproductId,
      );

      if (createPreproductPackageDto.remainingPreproductId) {
        await this.preproductService.findById(
          createPreproductPackageDto.remainingPreproductId,
        );
      }

      const existing = await queryRunner.manager.findOne(PreproductPackage, {
        where: { preproductId: createPreproductPackageDto.preproductId },
      });

      if (existing) {
        throw new ConflictException(
          'Packages are already created from this preproduct dhope',
        );
      }

      // Calculate total weight and number of packages
      const totalWeight =
        preproduct.preproductWeight +
        (createPreproductPackageDto.remainingWeight || 0);
      const maxPackages = Math.floor(
        totalWeight / createPreproductPackageDto.packageWeight,
      );

      // Create packages
      const packages: PreproductPackage[] = [];
      const createdPackageIds: number[] = [];
      for (let i = 0; i < maxPackages; i++) {
        const pkg = queryRunner.manager.create(PreproductPackage, {
          ...createPreproductPackageDto,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: createPreproductPackageDto.userId,
          updatedBy: createPreproductPackageDto.userId,
        });
        packages.push(pkg);
      }

      // Save packages
      if (packages.length > 0) {
        const savedPackages = await queryRunner.manager.save(packages);
        createdPackageIds.push(...savedPackages.map((pkg) => pkg.id));
      }

      // Emit event here
      this.eventEmitter.emit(
        'preproduct-package.created',
        new PreproductPackageCreatedEvent(
          company.id,
          maxPackages,
          maxPackages * createPreproductPackageDto.packageWeight,
        ),
      );

      await queryRunner.commitTransaction();

      const results = await this.preproductPackageRepository.find({
        where: { id: In(createdPackageIds) },
        relations: [
          'preproduct',
          'preproduct.batch',
          // 'preproduct.batch.batchBales',
          // 'preproduct.batch.batchBales.bale',
          // 'preproduct.batch.batchBales.bale.company',
          'remainingPreproduct',
          'remainingPreproduct.batch',
          // 'remainingPreproduct.batch.batchBales',
          // 'remainingPreproduct.batch.batchBales.bale',
          // 'remainingPreproduct.batch.batchBales.bale.company',
        ],
      });

      if (!results) {
        throw new HttpException(
          'Failed to retrieve created package',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.saveToFabric(results, company);

      return results.map((preproductPackage) =>
        plainToClass(PreproductPackageResponseDTO, {
          ...preproductPackage,
          // oceanBoundWeight: oceanBoundWeight,
          // oceanBoundPercentage: oceanBoundPercentage,
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
    query: GetPreproductPackageDTO,
  ): Promise<PreproductPackageResponseDTO[]> {
    const queryBuilder = this.preproductPackageRepository
      .createQueryBuilder('preproductPackage')
      .leftJoinAndSelect('preproductPackage.preproduct', 'preproduct')
      .leftJoinAndSelect('preproduct.batch', 'batch')
      // .leftJoinAndSelect('batch.batchBales', 'batchBales')
      // .leftJoinAndSelect('batchBales.bale', 'bale')
      // .leftJoinAndSelect('bale.company', 'company')
      .leftJoinAndSelect(
        'preproductPackage.remainingPreproduct',
        'remainingPreproduct',
      )
      .leftJoinAndSelect('remainingPreproduct.batch', 'remainingBatch')
      // .leftJoinAndSelect('remainingBatch.batchBales', 'remainingBatchBales')
      // .leftJoinAndSelect('remainingBatchBales.bale', 'remainingBale')
      // .leftJoinAndSelect('remainingBale.company', 'remainingCompany')
      .orderBy('"preproductPackage"."createdAt"', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"preproductPackage"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"preproductPackage"."createdAt" >= :startOfDay AND "preproductPackage"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"preproductPackage"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"preproductPackage"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const packages = await queryBuilder.getMany();

    return packages.map((preproductPackage) =>
      plainToClass(PreproductPackageResponseDTO, preproductPackage),
    );
  }

  async getReport(
    query: GetPreproductDTO,
  ): Promise<PreproductPackageReportDTO> {
    const queryBuilder = this.preproductPackageRepository
      .createQueryBuilder('preproductPackage')
      .select(
        'SUM(CASE WHEN preproductPackage.status = :inStockStatus THEN 1 ELSE 0 END)',
        'preproductPackageQuantity',
      )
      .addSelect(
        'SUM(CASE WHEN preproductPackage.status = :status THEN 1 ELSE 0 END)',
        'shippedPreproductPackageQuantity',
      )
      .setParameter('inStockStatus', 'InStock')
      .setParameter('status', 'Shipped');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
      queryBuilder.andWhere('preproductPackage.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      queryBuilder.andWhere(
        'preproductPackage.createdAt >= :startOfDay AND preproductPackage.createdAt <= :endOfDay',
        { startOfDay, endOfDay },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('preproductPackage.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('preproductPackage.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const stats = await queryBuilder.getRawOne();

    return {
      preproductPackageQuantity:
        parseFloat(stats.preproductPackageQuantity) || 0,
      shippedPreproductPackageQuantity:
        parseFloat(stats.shippedPreproductPackageQuantity) || 0,
    };
  }

  async findById(id: number): Promise<PreproductPackageResponseDTO> {
    const packages = await this.preproductPackageRepository.findOne({
      where: { id },
      relations: [
        'preproduct',
        'preproduct.batch',
        // 'preproduct.batch.batchBales',
        // 'preproduct.batch.batchBales.bale',
        // 'preproduct.batch.batchBales.bale.company',
        'remainingPreproduct',
        'remainingPreproduct.batch',
        // 'remainingPreproduct.batch.batchBales',
        // 'remainingPreproduct.batch.batchBales.bale',
        // 'remainingPreproduct.batch.batchBales.bale.company',
      ],
    });

    if (!packages) {
      throw new NotFoundException(
        `Preproduct Package with the given ID ${id} not found`,
      );
    }

    const preproduct_1 = await this.preproductService.findById(
      packages.preproduct.id,
    );

    let preproduct_2;
    if (packages.remainingPreproduct) {
      preproduct_2 = await this.preproductService.findById(
        packages.remainingPreproduct.id,
      );
    }

    // Calculate Ocean bound percentage
    const preproduct_1_BaleWeight: Record<string, number> = {};
    const preproduct_2_BaleWeight: Record<string, number> = {};

    if (preproduct_1.companyBaleWeights) {
      for (const [id, weight] of Object.entries(
        preproduct_1.companyBaleWeights,
      )) {
        preproduct_1_BaleWeight[id] =
          (preproduct_1_BaleWeight[id] ?? 0) + weight;
      }
    }

    if (preproduct_2 && preproduct_2.companyBaleWeights) {
      for (const [id, weight] of Object.entries(
        preproduct_2.companyBaleWeights,
      )) {
        preproduct_2_BaleWeight[id] =
          (preproduct_2_BaleWeight[id] ?? 0) + (weight as number);
      }
    }

    const preproduct_1_totalBaleWeight = Object.values(
      preproduct_1_BaleWeight,
    ).reduce((sum, w) => sum + w, 0);

    const preproduct_2_totalBaleWeight = Object.values(
      preproduct_2_BaleWeight,
    ).reduce((sum, w) => sum + w, 0);

    //Ocean bound (OB) weight in preproduct 2
    let OBWeight_preproduct_2 = 0;

    if (preproduct_2 && preproduct_2_totalBaleWeight > 0) {
      OBWeight_preproduct_2 =
        (preproduct_2_BaleWeight['2'] * packages.remainingWeight) /
        preproduct_2_totalBaleWeight;
    }

    //oceanBoundWeight = ((OB weight of preproduct 1 + OB weight of remaining preproduct 2) * package weight) / (Total Bale weight of preproduct 1 and total remaining weight of preproduct 2)
    const oceanBoundWeight = (
      ((preproduct_1_BaleWeight['2'] + OBWeight_preproduct_2) *
        packages.packageWeight) /
      (preproduct_1_totalBaleWeight +
        (preproduct_2 ? packages.remainingWeight : 0))
    ).toFixed(2);

    const oceanBoundPercentage = (
      (Number(oceanBoundWeight) * 100) /
      packages.packageWeight
    ).toFixed(2);

    return plainToClass(PreproductPackageResponseDTO, {
      ...packages,
      oceanBoundWeight: oceanBoundWeight,
      oceanBoundPercentage: oceanBoundPercentage,
    });
  }

  async updatePreproductPackageStatus(
    id: number,
  ): Promise<PreproductPackageResponseDTO> {
    const preproductPackage = await this.preproductPackageRepository.findOne({
      where: { id },
    });

    if (!preproductPackage) {
      throw new HttpException(
        `Preproduct package with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    preproductPackage.status = Status.Shipped;
    preproductPackage.updatedAt = new Date();

    const packages =
      await this.preproductPackageRepository.save(preproductPackage);

    return plainToClass(PreproductPackageResponseDTO, packages);
  }

  private async saveToFabric(
    results: PreproductPackage[],
    company: Company,
  ): Promise<void> {
    // Process each package individually
    for (const result of results) {
      try {
        // Extract all relevant fields from the database entity
        const packagePreproduct = {
          id: result.id,
          preproductId: result.preproductId,
          productType: result.productType,
          packageWeight: result.packageWeight,
          status: result.status,
          createdAt: result.createdAt,
          createdBy: result.createdBy,
          companyId: result.companyId,
          userId: result.userId,
          remainingPreproductId: result.remainingPreproductId,
          remainingWeight: result.remainingWeight,
        };

        const orgContext: bOrganizationContext = {
          channelName: company.channelName,
          chaincodeName: company.chaincodeName,
          userOrg: company.peerName,
        };

        const deferred = defer(() =>
          this.bPackagePreproductService.createPackagePreproduct(
            packagePreproduct,
            orgContext,
          ),
        ).pipe(retry({ count: 3, delay: 1000 }));

        const fabricResult = await lastValueFrom(deferred);
      } catch (error) {
        console.error(
          'Failed to save package to Fabric for ID:',
          result.id,
          error,
        );
        // You might want to decide whether to throw here or continue with other packages
        // throw error; // Uncomment if you want to stop on first failure
      }
    }
  }
}
