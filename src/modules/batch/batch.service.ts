import { bBatchData, bBatchService, bOrganizationContext } from '@bpcl/fabric';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass, plainToInstance } from 'class-transformer';
import { defer, lastValueFrom, retry } from 'rxjs';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { BaleService } from '../bale/bale.service';
import { BaleResponseDTO } from '../bale/dto/bale-response.dto';
import { BaleStatus } from '../bale/enum/status.enum';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { AssignBaleEvent } from '../inventory/events/assign-bale.event';
import { UnloadShipmentBale } from '../unload-shipment/entities/unload-shipment-bale.entity';
import { AssignBaleToBatchDTO } from './dto/assign-bale-to-batch.dto.';
import { BatchBaleResponseDTO } from './dto/batch-bale-response.dto';
import { BatchResponseDTO } from './dto/batch-response.dto';
import { CreateBatchDTO } from './dto/create-batch.dto';
import { GetBatchDTO } from './dto/get-batch.dto';
import { BatchBale } from './entities/batch-bale.entity';
import { Batch } from './entities/batch.entity';
import { Status } from './enum/status.enum';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Batch)
    private batchRepository: Repository<Batch>,
    @InjectRepository(BatchBale)
    private batchBaleRepository: Repository<BatchBale>,
    @InjectRepository(UnloadShipmentBale)
    private unloadShipmentBaleRepository: Repository<UnloadShipmentBale>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private companyService: CompanyService,
    private authService: AuthService,
    @Inject(forwardRef(() => BaleService))
    private readonly baleService: BaleService,
    private bBatchService: bBatchService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createBatchDto: CreateBatchDTO): Promise<BatchResponseDTO> {
    const queryRunner =
      this.batchRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await this.companyService.findById(
        createBatchDto.companyId,
      );

      await this.authService.findById(createBatchDto.userId);

      const batch = queryRunner.manager.create(Batch, {
        ...createBatchDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createBatchDto.userId,
        updatedBy: createBatchDto.userId,
      });

      const savedBatch = await queryRunner.manager.save(batch);
      savedBatch.batchDisplayId = this.formatBatchDisplayId(savedBatch.id);
      await queryRunner.manager.save(savedBatch);

      await this.saveToFabric(savedBatch, company);

      await queryRunner.commitTransaction();

      const result = await this.batchRepository.findOne({
        where: { id: savedBatch.id },
        relations: ['batchBales', 'batchBales.bale'],
      });

      if (!result) {
        throw new HttpException(
          'Failed to retrieve created batch',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return plainToClass(BatchResponseDTO, {
        ...result,
        batchDisplayId: this.formatBatchDisplayId(result.id),
        totalBales: 0,
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async assignBaleToBatch(
    dto: AssignBaleToBatchDTO,
  ): Promise<BatchResponseDTO> {
    const { batchId, baleId } = dto;

    const bale = await this.baleService.findById(baleId);

    const batch = await this.batchRepository.findOne({
      where: { id: batchId },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const existing = await this.batchBaleRepository.findOne({
      where: { baleId },
    });

    if (existing) {
      throw new ConflictException(`Bale is already assigned to a batch`);
    }

    // Check if given bale id is shipped/unloaded or not
    const shippedBale = await this.unloadShipmentBaleRepository.findOne({
      where: { baleId },
    });

    if (!shippedBale) {
      throw new BadRequestException(
        `Bale with given id is not shipped or unloaded yet`,
      );
    }

    await this.batchBaleRepository.save({
      batchId,
      baleId,
    });

    const company = await this.companyRepository.findOne({
      where: { name: bale.companyName },
    });

    const companyBaleWeights: { [companyId: number]: number } =
      batch.companyBaleWeights ? { ...batch.companyBaleWeights } : {};

    companyBaleWeights[company!.id] =
      (companyBaleWeights[company!.id] || 0) + bale.baleShipmentWeight;

    batch.weight = (batch.weight || 0) + bale.baleShipmentWeight;

    batch.companyBaleWeights = companyBaleWeights;
    batch.batchDisplayId = this.formatBatchDisplayId(batch.id);
    batch.updatedAt = new Date();
    await this.batchRepository.save(batch);

    await this.baleService.updateBale(baleId, BaleStatus.Processed);

    const result = await this.batchRepository.findOne({
      where: { id: batchId },
      relations: ['batchBales', 'batchBales.bale', 'batchBales.bale.company'],
    });

    // Emit event here
    this.eventEmitter.emit(
      'assign-bale.created',
      new AssignBaleEvent(
        batch.companyId,
        bale.baleShipmentWeight,
        bale.packagingType,
      ),
    );

    const company2 = await this.companyService.findById(batch.companyId);
    // get the bale from db
    const bale2 = await this.baleService.findById(baleId);
    const baleCompanyId = bale2.companyId;
    await this.updateToFabric(batchId, baleId, baleCompanyId, company2);

    if (!result) {
      throw new HttpException(
        'Failed to retrieve created batch',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return plainToClass(BatchResponseDTO, {
      ...result,
      batchDisplayId: this.formatBatchDisplayId(result.id),
      totalBales: result.batchBales?.length || 0,
      batchBales: result.batchBales.map((bb) =>
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
    });
  }

  async findAllByCompany(query: GetBatchDTO): Promise<BatchResponseDTO[]> {
    const queryBuilder = this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.batchBales', 'batchBales')
      .leftJoinAndSelect('batchBales.bale', 'bale')
      .leftJoinAndSelect('bale.company', 'company')
      .orderBy('batch.createdAt', 'DESC')
      .addOrderBy('batch.id', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }
    if (query.status) {
      queryBuilder.andWhere('"batch"."batchCreationStatus" = :status', {
        status: query.status,
      });
    }

    if (query.companyId) {
      queryBuilder.andWhere('"batch"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"batch"."createdAt" >= :startOfDay AND "batch"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"batch"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"batch"."createdAt" <= :toDate', {
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

    const batches = await queryBuilder.getMany();

    return batches.map((batch) =>
      plainToClass(BatchResponseDTO, {
        ...batch,
        batchDisplayId: this.formatBatchDisplayId(batch.id),
        totalBales: batch.batchBales?.length || 0,
        batchBales: batch.batchBales.map((bb) =>
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
    );
  }

  async findById(id: number): Promise<BatchResponseDTO> {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: ['batchBales', 'batchBales.bale', 'batchBales.bale.company'],
    });

    if (!batch) {
      throw new NotFoundException('Batch with the given ID not found');
    }

    return plainToClass(BatchResponseDTO, {
      ...batch,
      batchDisplayId: this.formatBatchDisplayId(batch.id),
      totalBales: batch.batchBales?.length || 0,
      batchBales: batch.batchBales.map((bb) =>
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
    });
  }

  async updateBatch(
    id: number,
    preproductCreationStatus?: string,
  ): Promise<BatchResponseDTO> {
    const batch = await this.batchRepository.findOne({
      where: { id },
      relations: ['batchBales', 'batchBales.bale', 'batchBales.bale.company'],
    });

    if (!batch) {
      throw new HttpException(
        `Batch with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (preproductCreationStatus) {
      batch.preproductCreationStatus = Status.Completed;
    } else {
      batch.batchCreationStatus = Status.Completed;
    }
    batch.batchDisplayId = this.formatBatchDisplayId(batch.id);
    batch.updatedAt = new Date();

    const updatedBatch = await this.batchRepository.save(batch);

    return plainToClass(BatchResponseDTO, {
      ...updatedBatch,
      batchDisplayId: this.formatBatchDisplayId(updatedBatch.id),
      totalBales: updatedBatch.batchBales?.length || 0,
      batchBales: updatedBatch.batchBales.map((bb) =>
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
    });
  }

  private formatBatchDisplayId(id: number): string {
    return id.toString();
  }

  private async saveToFabric(batch: Batch, company: Company): Promise<void> {
    const batchData: bBatchData = {
      id: batch.id,
      batchDisplayId: batch.batchDisplayId,
      productType: batch.productType,
      status: batch.batchCreationStatus,
      createdAt: batch.createdAt,
      createdBy: batch.createdBy,
      companyId: batch.companyId,
      userId: batch.userId,
      baleIds: [],
      baleCompanyIds: [],
    };

    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bBatchService.createBatch(batchData, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }

  private async updateToFabric(
    batchId: number,
    baleId: number,
    baleCompanyId: number,
    company: Company,
  ): Promise<void> {
    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bBatchService.addBaleToBatch(
        batchId,
        baleId,
        baleCompanyId,
        orgContext,
      ),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }
}
