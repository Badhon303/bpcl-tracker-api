import { bLotData, bLotService, bOrganizationContext } from '@bpcl/fabric';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { defer, lastValueFrom, retry } from 'rxjs';
import { In, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { BaleResponseDTO } from '../bale/dto/bale-response.dto';
import { BatchBaleResponseDTO } from '../batch/dto/batch-bale-response.dto';
import { BatchResponseDTO } from '../batch/dto/batch-response.dto';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { PreproductPackage } from '../preproduct-package/entities/preproduct-package.entity';
import { PreproductResponseDTO } from '../preproduct/dto/preproduct-response.dto';
import { PreproductService } from '../preproduct/preproduct.service';
import { CreateLotDTO } from './dtos/create-lot.dto';
import { GetLotDTO } from './dtos/get-lot.dto';
import { LotPreproductResponseDTO } from './dtos/lot-preproduct-response.dto';
import { LotResponseDTO } from './dtos/lot-response.dto';
import { LotPreproduct } from './entities/lot-preproduct.entity';
import { Lot } from './entities/lot.entity';
import { Status } from './enum/status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LotCreatedEvent } from '../inventory/events/lot-created.event';
@Injectable()
export class LotService {
  constructor(
    @InjectRepository(Lot)
    private lotRepository: Repository<Lot>,
    @InjectRepository(LotPreproduct)
    private lotPreproductRepository: Repository<LotPreproduct>,
    @InjectRepository(PreproductPackage)
    private preproductPackageRepository: Repository<PreproductPackage>,
    private companyService: CompanyService,
    private authService: AuthService,
    private preproductService: PreproductService,
    private bLotService: bLotService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createLotDto: CreateLotDTO): Promise<LotResponseDTO> {
    const queryRunner =
      this.lotRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { preproductIds, ...lotData } = createLotDto;

      const company = await this.companyService.findById(
        createLotDto.companyId,
      );

      await this.authService.findById(createLotDto.userId);

      let weight = 0;

      // Check if preproduct exist and aren't already in a lot
      if (preproductIds && preproductIds.length > 0) {
        // 1. Check if all preproduct exist

        // for (const preproductId of preproductIds) {
        //   const preproduct =
        //     await this.preproductService.findById(preproductId);
        //   weight += preproduct.preproductWeight;
        // }

        weight = await this.preproductService.sumWeightByIds(preproductIds);

        // 2. Check if any preproduct is already in a lot
        const existinglotPreproducts = await queryRunner.manager
          .createQueryBuilder(LotPreproduct, 'lotPreproduct')
          .where('lotPreproduct.preproductId IN (:...preproductIds)', {
            preproductIds,
          })
          .getMany();

        if (existinglotPreproducts.length > 0) {
          const usedPreproductIds = existinglotPreproducts.map(
            (sb) => sb.preproductId,
          );
          throw new ConflictException(
            `Preproduct with ID ${usedPreproductIds.join(', ')} is already associated with another lot`,
          );
        }
        // 3. Check if any preproduct is already used for creating preproduct package
        // for (const preproductId of preproductIds) {
        //   const preproduct = await queryRunner.manager.findOne(
        //     this.preproductPackageRepository.target,
        //     { where: { preproductId } },
        //   );
        //   if (preproduct) {
        //     throw new ConflictException(
        //       `Preproduct with id ${preproductId} is already used for creating preproduct packages`,
        //     );
        //   }
        // }
        const used = await queryRunner.manager.find(
          this.preproductPackageRepository.target,
          {
            where: { preproductId: In(preproductIds) },
            select: ['preproductId'],
          },
        );

        if (used.length > 0) {
          const uniqueIds = [...new Set(used.map((u) => u.preproductId))];
          throw new ConflictException(
            `These preproducts are already used for creating preproduct packages: ${uniqueIds.join(', ')}`,
          );
        }
      }

      const lot = queryRunner.manager.create(this.lotRepository.target, {
        ...lotData,
        weight,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: lotData.userId,
        updatedBy: lotData.userId,
      });

      const savedLot = await queryRunner.manager.save(lot);

      await this.saveToFabric(savedLot, preproductIds, company);

      if (preproductIds && preproductIds.length > 0) {
        const lotPreproducts = preproductIds.map((preproductId) => ({
          preproductId,
          lotId: savedLot.id,
        }));

        await queryRunner.manager.save(
          this.lotPreproductRepository.target,
          lotPreproducts,
        );
      }

      // Emit event here
      this.eventEmitter.emit(
        'lot.created',
        new LotCreatedEvent(company.id, weight),
      );

      await queryRunner.commitTransaction();

      const result = await this.lotRepository.findOne({
        where: { id: savedLot.id },
        relations: [
          'lotPreproducts',
          'lotPreproducts.preproduct',
          // 'lotPreproducts.preproduct.batch',
          // 'lotPreproducts.preproduct.batch.batchBales',
          // 'lotPreproducts.preproduct.batch.batchBales.bale',
          // 'lotPreproducts.preproduct.batch.batchBales.bale.company',
        ],
      });

      if (!result) {
        throw new HttpException(
          'Failed to retrieve created lot',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return plainToInstance(LotResponseDTO, {
        ...result,
        lotPreproducts: result.lotPreproducts.map((lp) =>
          plainToInstance(LotPreproductResponseDTO, {
            ...lp,
            preproduct: plainToInstance(PreproductResponseDTO, {
              ...lp.preproduct,
              companyName: company.name,
              // batch: plainToInstance(BatchResponseDTO, {
              //   ...lp.preproduct.batch,
              //   batchBales: lp.preproduct.batch.batchBales.map((bb) =>
              //     plainToInstance(BatchBaleResponseDTO, {
              //       ...bb,
              //       bale: plainToInstance(
              //         BaleResponseDTO,
              //         {
              //           ...bb.bale,
              //           companyName: bb.bale.company.name,
              //         },
              //         { excludeExtraneousValues: true },
              //       ),
              //     }),
              //   ),
              // }),
            }),
          }),
        ),
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByCompany(query: GetLotDTO): Promise<LotResponseDTO[]> {
    const queryBuilder = this.lotRepository
      .createQueryBuilder('lot')
      .leftJoinAndSelect('lot.lotPreproducts', 'lotPreproducts')
      .leftJoinAndSelect('lotPreproducts.preproduct', 'preproduct')
      // .leftJoinAndSelect('preproduct.batch', 'batch')
      // .leftJoinAndSelect('batch.batchBales', 'batchBales')
      // .leftJoinAndSelect('batchBales.bale', 'bale')
      // .leftJoinAndSelect('bale.company', 'company')
      .orderBy('lot.createdAt', 'DESC')
      .addOrderBy('lot.id', 'DESC')
      .andWhere('"lot"."status" = :status', {
        status: 'Ongoing',
      });

    let company;
    if (query.companyId) {
      company = await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"lot"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"lot"."createdAt" >= :startOfDay AND "lot"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"lot"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"lot"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const requestedLimit = Math.trunc(Number(query.limit));
    if (Number.isFinite(requestedLimit) && requestedLimit > 0) {
      const requestedPage = Number(query.page);
      const page = Number.isFinite(requestedPage)
        ? Math.max(Math.trunc(requestedPage), 1)
        : 1;
      const safeLimit = Math.min(requestedLimit, 100);
      queryBuilder.skip((page - 1) * safeLimit).take(safeLimit);
    }

    const lots = await queryBuilder.getMany();

    return lots.map((result) =>
      plainToInstance(LotResponseDTO, {
        ...result,
        lotPreproducts: result.lotPreproducts.map((lp) =>
          plainToInstance(LotPreproductResponseDTO, {
            ...lp,
            preproduct: plainToInstance(PreproductResponseDTO, {
              ...lp.preproduct,
              companyName: company.name,
              // batch: plainToInstance(BatchResponseDTO, {
              //   ...lp.preproduct.batch,
              //   batchBales: lp.preproduct.batch.batchBales.map((bb) =>
              //     plainToInstance(BatchBaleResponseDTO, {
              //       ...bb,
              //       bale: plainToInstance(
              //         BaleResponseDTO,
              //         {
              //           ...bb.bale,
              //           companyName: bb.bale.company.name,
              //         },
              //         { excludeExtraneousValues: true },
              //       ),
              //     }),
              //   ),
              // }),
            }),
          }),
        ),
      }),
    );
  }

  async findById(id: number): Promise<LotResponseDTO> {
    const lot = await this.lotRepository.findOne({
      where: { id },
      relations: [
        'lotPreproducts',
        'lotPreproducts.preproduct',
        // 'lotPreproducts.preproduct.batch',
        // 'lotPreproducts.preproduct.batch.batchBales',
        // 'lotPreproducts.preproduct.batch.batchBales.bale',
        // 'lotPreproducts.preproduct.batch.batchBales.bale.company',
      ],
    });

    if (!lot) {
      throw new NotFoundException('Lot with the given ID not found');
    }

    let company;
    if (lot.companyId) {
      company = await this.companyService.findById(lot.companyId);
    }

    // Get all preproduct IDs at once
    const preproductIds = lot.lotPreproducts.map((p) => p.preproductId);

    //Query all preproducts
    const preproducts =
      await this.preproductService.findPreproductByIds(preproductIds);

    const companyBaleWeights: Record<string, number> = {};

    // Create a map for faster lookup
    const preproductMap = new Map(preproducts.map((p) => [p.id, p]));

    // Process in memory (much faster)
    for (const p of lot.lotPreproducts) {
      const preproduct = preproductMap.get(p.preproductId);
      if (preproduct?.companyBaleWeights) {
        for (const [companyId, weight] of Object.entries(
          preproduct.companyBaleWeights,
        )) {
          companyBaleWeights[companyId] =
            (companyBaleWeights[companyId] ?? 0) + weight;
        }
      }
    }

    return plainToInstance(LotResponseDTO, {
      ...lot,
      companyBaleWeights: companyBaleWeights,
      lotPreproducts: lot.lotPreproducts.map((lp) =>
        plainToInstance(LotPreproductResponseDTO, {
          ...lp,
          preproduct: plainToInstance(PreproductResponseDTO, {
            ...lp.preproduct,
            companyName: company.name,
            // batch: plainToInstance(BatchResponseDTO, {
            //   ...lp.preproduct.batch,
            //   batchBales: lp.preproduct.batch.batchBales.map((bb) =>
            //     plainToInstance(BatchBaleResponseDTO, {
            //       ...bb,
            //       bale: plainToInstance(
            //         BaleResponseDTO,
            //         {
            //           ...bb.bale,
            //           companyName: bb.bale.company.name,
            //         },
            //         { excludeExtraneousValues: true },
            //       ),
            //     }),
            //   ),
            // }),
          }),
        }),
      ),
    });
  }

  private async saveToFabric(
    lot: Lot,
    preproductIds: number[],
    company: Company,
  ) {
    const lotData: bLotData = {
      id: lot.id,
      productType: lot.productType,
      createdAt: lot.createdAt,
      createdBy: lot.createdBy,
      companyId: lot.companyId,
      userId: lot.userId,
      preproductIds: preproductIds,
    };

    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      // userOrg: company.peerName
      userOrg: 'Org1',
    };

    const deferred = defer(() =>
      this.bLotService.createLot(lotData, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }

  async updateLot(id: number): Promise<LotResponseDTO> {
    const lot = await this.lotRepository.findOne({
      where: { id },
      relations: [
        'lotPreproducts',
        'lotPreproducts.preproduct',
        'lotPreproducts.preproduct.batch',
        'lotPreproducts.preproduct.batch.batchBales',
        'lotPreproducts.preproduct.batch.batchBales.bale',
        'lotPreproducts.preproduct.batch.batchBales.bale.company',
      ],
    });

    if (!lot) {
      throw new HttpException(
        `Lot with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    lot.status = Status.Completed;
    lot.updatedAt = new Date();

    const updatedLot = await this.lotRepository.save(lot);

    return plainToInstance(LotResponseDTO, {
      ...updatedLot,
      lotPreproducts: updatedLot.lotPreproducts.map((lp) =>
        plainToInstance(LotPreproductResponseDTO, {
          ...lp,
          preproduct: plainToInstance(PreproductResponseDTO, {
            ...lp.preproduct,
            batch: plainToInstance(BatchResponseDTO, {
              ...lp.preproduct.batch,
              batchBales: lp.preproduct.batch.batchBales.map((bb) =>
                plainToInstance(BatchBaleResponseDTO, {
                  ...bb,
                  bale: plainToInstance(
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
    });
  }
}
