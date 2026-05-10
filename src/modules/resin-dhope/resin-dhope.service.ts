import {
  bOrganizationContext,
  bResinDhopeData,
  bResinDhopeService,
} from '@bpcl/fabric';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { defer, lastValueFrom, retry } from 'rxjs';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { BaleResponseDTO } from '../bale/dto/bale-response.dto';
import { BatchBaleResponseDTO } from '../batch/dto/batch-bale-response.dto';
import { BatchResponseDTO } from '../batch/dto/batch-response.dto';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { ResinDhopeCreatedEvent } from '../inventory/events/resin-dhope-created.event';
import { LotPreproductResponseDTO } from '../lot/dtos/lot-preproduct-response.dto';
import { LotResponseDTO } from '../lot/dtos/lot-response.dto';
import { LotService } from '../lot/lot.service';
import { PreproductResponseDTO } from '../preproduct/dto/preproduct-response.dto';
import { CreateResinDhopeDTO } from './dtos/create-resin-dhope.dto';
import { GetResinDhopeDTO } from './dtos/get-resin-dhope.dto';
import { ResinDhopeReportDTO } from './dtos/resin-dhope-report.dto';
import { ResinDhopeResponseDTO } from './dtos/resin-dhope-response.dto';
import { ResinDhope } from './entities/resin-dhope.entity';

@Injectable()
export class ResinDhopeService {
  constructor(
    @InjectRepository(ResinDhope)
    private resinDhopeRepository: Repository<ResinDhope>,
    private companyService: CompanyService,
    private authService: AuthService,
    private lotService: LotService,
    private bResinDhopeService: bResinDhopeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createResinDhopeDto: CreateResinDhopeDTO,
  ): Promise<ResinDhopeResponseDTO> {
    const queryRunner =
      this.resinDhopeRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await this.companyService.findById(
        createResinDhopeDto.companyId,
      );

      await this.authService.findById(createResinDhopeDto.userId);
      const lot = await this.lotService.findById(createResinDhopeDto.lotId);

      const { totalWeight } = await queryRunner.manager
        .createQueryBuilder(ResinDhope, 'resinDhope')
        .select('SUM(resinDhope.resinDhopeWeight)', 'totalWeight')
        .innerJoin('resinDhope.lot', 'lot')
        .where('lot.id = :lotId', { lotId: createResinDhopeDto.lotId })
        .getRawOne();

      if (lot.weight < totalWeight + createResinDhopeDto.resinDhopeWeight) {
        throw new BadRequestException(
          `Total resin dhope weight cannot exceed lot weight of ${lot.weight} kg from lot ${lot.id}`,
        );
      }

      const resinDhope = queryRunner.manager.create(ResinDhope, {
        ...createResinDhopeDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createResinDhopeDto.userId,
        updatedBy: createResinDhopeDto.userId,
      });

      const savedResinDhope = await queryRunner.manager.save(resinDhope);

      await this.saveToFabric(savedResinDhope, company);

      if (
        lot.weight - (totalWeight + createResinDhopeDto.resinDhopeWeight) <=
        10
      ) {
        this.lotService.updateLot(createResinDhopeDto.lotId);
      }

      // Emit event here
      this.eventEmitter.emit(
        'resin-dhope.created',
        new ResinDhopeCreatedEvent(
          company.id,
          createResinDhopeDto.resinDhopeWeight,
        ),
      );

      await queryRunner.commitTransaction();

      const result = await this.resinDhopeRepository.findOne({
        where: { id: savedResinDhope.id },
        relations: [
          'lot',
          'lot.lotPreproducts',
          'lot.lotPreproducts.preproduct',
          'lot.lotPreproducts.preproduct.batch',
          'lot.lotPreproducts.preproduct.batch.batchBales',
          'lot.lotPreproducts.preproduct.batch.batchBales.bale',
          'lot.lotPreproducts.preproduct.batch.batchBales.bale.company',
        ],
      });

      if (!result) {
        throw new HttpException(
          'Failed to retrieve created pre-product',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return plainToClass(ResinDhopeResponseDTO, {
        ...result,
        lot: plainToClass(LotResponseDTO, {
          ...result.lot,
          lotPreproducts: result.lot.lotPreproducts.map((lp) =>
            plainToClass(LotPreproductResponseDTO, {
              ...lp,
              preproduct: plainToClass(PreproductResponseDTO, {
                ...lp.preproduct,
                batch: plainToClass(BatchResponseDTO, {
                  ...lp.preproduct.batch,
                  batchBales: lp.preproduct.batch.batchBales.map((bb) =>
                    plainToClass(BatchBaleResponseDTO, {
                      ...bb,
                      bale: plainToClass(
                        BaleResponseDTO,
                        {
                          ...bb.bale,
                          companyName: bb.bale.company.name,
                        },
                        { excludeExtraneousValues: true },
                      ),
                    }),
                  ),
                }),
              }),
            }),
          ),
        }),
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByCompany(
    query: GetResinDhopeDTO,
  ): Promise<ResinDhopeResponseDTO[]> {
    const queryBuilder = this.resinDhopeRepository
      .createQueryBuilder('resinDhope')
      .leftJoinAndSelect('resinDhope.lot', 'lot')
      // .leftJoinAndSelect('lot.lotPreproducts', 'lotPreproducts')
      // .leftJoinAndSelect('lotPreproducts.preproduct', 'preproduct')
      // .leftJoinAndSelect('preproduct.batch', 'batch')
      // .leftJoinAndSelect('batch.batchBales', 'batchBales')
      // .leftJoinAndSelect('batchBales.bale', 'bale')
      // .leftJoinAndSelect('bale.company', 'company')
      .orderBy('resinDhope.createdAt', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('resinDhope.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'resinDhope.createdAt >= :startOfDay AND resinDhope.createdAt <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('resinDhope.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('resinDhope.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const resinDhopes = await queryBuilder.getMany();

    return resinDhopes.map((resinDhope) =>
      plainToClass(ResinDhopeResponseDTO, {
        ...resinDhope,
        lot: plainToClass(LotResponseDTO, {
          ...resinDhope.lot,
          // lotPreproducts: resinDhope.lot.lotPreproducts.map((lp) =>
          //   plainToClass(LotPreproductResponseDTO, {
          //     ...lp,
          //     preproduct: plainToClass(PreproductResponseDTO, {
          //       ...lp.preproduct,
          //       batch: plainToClass(BatchResponseDTO, {
          //         ...lp.preproduct.batch,
          //         batchBales: lp.preproduct.batch.batchBales.map((bb) =>
          //           plainToClass(BatchBaleResponseDTO, {
          //             ...bb,
          //             bale: plainToClass(
          //               BaleResponseDTO,
          //               {
          //                 ...bb.bale,
          //                 companyName: bb.bale.company.name,
          //               },
          //               { excludeExtraneousValues: true },
          //             ),
          //           }),
          //         ),
          //       }),
          //     }),
          //   }),
          // ),
        }),
      }),
    );
  }

  async getReport(query: GetResinDhopeDTO): Promise<ResinDhopeReportDTO> {
    const queryBuilder = this.resinDhopeRepository
      .createQueryBuilder('resinDhope')
      .select(
        `SUM(
      COALESCE(resinDhope.resinDhopeWeight, 0)
    )`,
        'resinDhopeWeight',
      );

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
      queryBuilder.andWhere('resinDhope.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      queryBuilder.andWhere(
        'resinDhope.createdAt >= :startOfDay AND resinDhope.createdAt <= :endOfDay',
        { startOfDay, endOfDay },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('resinDhope.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('resinDhope.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const stats = await queryBuilder.getRawOne();

    return {
      resinDhopeWeight: parseFloat(stats.resinDhopeWeight) || 0,
    };
  }

  async findById(id: number): Promise<ResinDhopeResponseDTO> {
    const resinDhope = await this.resinDhopeRepository.findOne({
      where: { id },
      relations: [
        'lot',
        // 'lot.lotPreproducts',
        // 'lot.lotPreproducts.preproduct',
        // 'lot.lotPreproducts.preproduct.batch',
        // 'lot.lotPreproducts.preproduct.batch.batchBales',
        // 'lot.lotPreproducts.preproduct.batch.batchBales.bale',
        // 'lot.lotPreproducts.preproduct.batch.batchBales.bale.company',
      ],
    });

    if (!resinDhope) {
      throw new NotFoundException(
        `Resin dhope with the given ID ${id} not found`,
      );
    }
    const lot = await this.lotService.findById(resinDhope.lot.id);

    return plainToClass(ResinDhopeResponseDTO, {
      ...resinDhope,
      companyBaleWeights: lot.companyBaleWeights,
      lot: plainToClass(LotResponseDTO, {
        ...resinDhope.lot,
        // lotPreproducts: resinDhope.lot.lotPreproducts.map((lp) =>
        //   plainToClass(LotPreproductResponseDTO, {
        //     ...lp,
        //     preproduct: plainToClass(PreproductResponseDTO, {
        //       ...lp.preproduct,
        //       batch: plainToClass(BatchResponseDTO, {
        //         ...lp.preproduct.batch,
        //         batchBales: lp.preproduct.batch.batchBales.map((bb) =>
        //           plainToClass(BatchBaleResponseDTO, {
        //             ...bb,
        //             bale: plainToClass(
        //               BaleResponseDTO,
        //               {
        //                 ...bb.bale,
        //                 companyName: bb.bale.company.name,
        //               },
        //               { excludeExtraneousValues: true },
        //             ),
        //           }),
        //         ),
        //       }),
        //     }),
        //   }),
        // ),
      }),
    });
  }

  private async saveToFabric(
    resinDhope: ResinDhope,
    company: Company,
  ): Promise<void> {
    const bresinDhope: bResinDhopeData = {
      id: resinDhope.id,
      lotId: resinDhope.lotId,
      machine: resinDhope.machine,
      grade: resinDhope.grade,
      productType: resinDhope.productType,

      resinDhopeWeight: resinDhope.resinDhopeWeight,
      wastageWeight: resinDhope.wastageWeight,
      createdAt: resinDhope.createdAt,
      createdBy: resinDhope.createdBy,
      companyId: resinDhope.companyId,
      userId: resinDhope.userId,
    };

    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bResinDhopeService.createResinDhope(bresinDhope, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }
}
