import {
  bOrganizationContext,
  bPreproductData,
  bPreproductService,
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
import { In, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { BatchService } from '../batch/batch.service';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { PreproductCreatedEvent } from '../inventory/events/preproduct-created.event';
import { CreatePreproductDTO } from './dto/create-preproduct.dto';
import { GetPreproductDTO } from './dto/get-preproduct.dto';
import { PreproductReportDTO } from './dto/preproduct-report.dto';
import { PreproductResponseDTO } from './dto/preproduct-response.dto';
import { Preproduct } from './entities/preproduct.entity';

@Injectable()
export class PreproductService {
  constructor(
    @InjectRepository(Preproduct)
    private preProductRepository: Repository<Preproduct>,
    private companyService: CompanyService,
    private authService: AuthService,
    private batchService: BatchService,
    private bPreProductServic: bPreproductService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createPreproductDto: CreatePreproductDTO,
  ): Promise<PreproductResponseDTO> {
    const queryRunner =
      this.preProductRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { batchId, ...preProductData } = createPreproductDto;

      const company = await this.companyService.findById(
        createPreproductDto.companyId,
      );

      await this.authService.findById(createPreproductDto.userId);
      const batch = await this.batchService.findById(
        createPreproductDto.batchId,
      );

      const { totalWeight } = await queryRunner.manager
        .createQueryBuilder(Preproduct, 'preproduct')
        .select('SUM(preproduct.preproductWeight)', 'totalWeight')
        .innerJoin('preproduct.batch', 'batch')
        .where('batch.id = :batchId', { batchId: createPreproductDto.batchId })
        .getRawOne();

      if (batch.weight < totalWeight + createPreproductDto.preproductWeight) {
        throw new BadRequestException(
          `Total preproduct weight cannot exceed batch weight of ${batch.weight} kg from batch ${batch.id}`,
        );
      }

      const preproductDisplayId = '001';
      const preProduct = queryRunner.manager.create(Preproduct, {
        ...createPreproductDto,
        preproductDisplayId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: preProductData.userId,
        updatedBy: preProductData.userId,
      });

      const savedPreproduct = await queryRunner.manager.save(preProduct);

      // if (
      //   batch.weight - (totalWeight + createPreproductDto.preproductWeight) <=
      //   10
      // ) {
      //   this.batchService.updateBatch(createPreproductDto.batchId, 'Completed');
      // }

      // Emit event here
      this.eventEmitter.emit(
        'preproduct.created',
        new PreproductCreatedEvent(
          company.id,
          createPreproductDto.preproductWeight,
        ),
      );

      await queryRunner.commitTransaction();

      await this.saveToFabric(savedPreproduct, company);

      const result = await this.preProductRepository.findOne({
        where: { id: savedPreproduct.id },
        relations: [
          'batch',
          // 'batch.batchBales',
          // 'batch.batchBales.bale',
          // 'batch.batchBales.bale.company',
        ],
      });

      if (!result) {
        throw new HttpException(
          'Failed to retrieve created pre-product',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return plainToClass(PreproductResponseDTO, {
        ...result,
        companyBaleWeights: result.batch.companyBaleWeights,
        companyName: company.name,
        // batch: plainToClass(BatchResponseDTO, {
        //   ...result.batch,
        //   batchBales: result.batch.batchBales.map((bb) =>
        //     plainToClass(BatchBaleResponseDTO, {
        //       ...bb,
        //       bale: plainToClass(
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
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByCompany(
    query: GetPreproductDTO,
  ): Promise<PreproductResponseDTO[]> {
    const queryBuilder = this.preProductRepository
      .createQueryBuilder('preProduct')
      .leftJoinAndSelect('preProduct.batch', 'batch')
      // .leftJoinAndSelect('batch.batchBales', 'batchBales')
      // .leftJoinAndSelect('batchBales.bale', 'bale')
      // .leftJoinAndSelect('bale.company', 'company')
      .orderBy('preProduct.createdAt', 'DESC');

    let company;
    if (query.companyId) {
      company = await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('preProduct.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'preProduct.createdAt >= :startOfDay AND preProduct.createdAt <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('preProduct.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('preProduct.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const preProducts = await queryBuilder.getMany();
    return preProducts.map((preProduct) =>
      plainToClass(PreproductResponseDTO, {
        ...preProduct,
        companyBaleWeights: preProduct.batch.companyBaleWeights,
        companyName: company.name,
        // batch: plainToClass(BatchResponseDTO, {
        //   ...preProduct.batch,
        //   batchBales: preProduct.batch.batchBales.map((bb) =>
        //     plainToClass(BatchBaleResponseDTO, {
        //       ...bb,
        //       bale: plainToClass(
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
    );
  }

  async getReport(query: GetPreproductDTO): Promise<PreproductReportDTO> {
    const queryBuilder = this.preProductRepository
      .createQueryBuilder('preproduct')
      .select(
        `SUM(
        COALESCE(preproduct.preproductWeight, 0)
      )`,
        'preproductWeight',
      );

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
      queryBuilder.andWhere('preproduct.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      queryBuilder.andWhere(
        'preproduct.createdAt >= :startOfDay AND preproduct.createdAt <= :endOfDay',
        { startOfDay, endOfDay },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('preproduct.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('preproduct.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const stats = await queryBuilder.getRawOne();

    return {
      preproductWeight: parseFloat(stats.preproductWeight) || 0,
    };
  }

  async findById(preproductId: number): Promise<PreproductResponseDTO> {
    const preProduct = await this.preProductRepository.findOne({
      where: { id: preproductId },
      relations: [
        'batch',
        // 'batch.batchBales',
        // 'batch.batchBales.bale',
        // 'batch.batchBales.bale.company',
      ],
    });

    if (!preProduct) {
      throw new NotFoundException(
        `Preproduct with the given ID ${preproductId} not found`,
      );
    }

    let company;
    if (preProduct) {
      company = await this.companyService.findById(preProduct.companyId);
    }

    return plainToClass(PreproductResponseDTO, {
      ...preProduct,
      companyBaleWeights: preProduct.batch.companyBaleWeights,
      companyName: company.name,
      // batch: plainToClass(BatchResponseDTO, {
      //   ...preProduct.batch,
      //   batchBales: preProduct.batch.batchBales.map((bb) =>
      //     plainToClass(BatchBaleResponseDTO, {
      //       ...bb,
      //       bale: plainToClass(
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
    });
  }

  async findPreproductByIds(
    preproductIds: number[],
  ): Promise<PreproductResponseDTO[]> {
    if (!preproductIds.length) return [];

    const preProducts = await this.preProductRepository.find({
      where: { id: In(preproductIds) },
      relations: [
        'batch',
        // 'batch.batchBales',
        // 'batch.batchBales.bale',
        // 'batch.batchBales.bale.company',
      ],
    });

    // Map to maintain order and handle missing preproducts
    const preproductMap = new Map(preProducts.map((p) => [p.id, p]));

    return preproductIds.map((id) => {
      const preProduct = preproductMap.get(id);
      if (!preProduct) {
        throw new NotFoundException(`Preproduct with ID ${id} not found`);
      }

      return plainToClass(PreproductResponseDTO, {
        ...preProduct,
        companyBaleWeights: preProduct.batch.companyBaleWeights,
      });
    });
  }

  private async saveToFabric(
    preProduct: Preproduct,
    company: Company,
  ): Promise<void> {
    const bpreProduct: bPreproductData = {
      id: preProduct.id,
      batchId: preProduct.batchId,
      preproductDisplayId: preProduct.preproductDisplayId,
      productType: preProduct.productType,
      grade: preProduct.grade,
      preproductWeight: preProduct.preproductWeight,
      wastageWeight: preProduct.wastageWeight,
      companyId: preProduct.companyId,
      userId: preProduct.userId,
      createdAt: preProduct.createdAt,
      createdBy: preProduct.createdBy,
    };

    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bPreProductServic.createPreproduct(bpreProduct, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }

  async sumWeightByIds(ids: number[]) {
    const result = await this.preProductRepository
      .createQueryBuilder('preproduct')
      .select('SUM(preproduct.preproductWeight)', 'total')
      .where('preproduct.id IN (:...ids)', { ids })
      .getRawOne();

    return Number(result.total) || 0;
  }
}
