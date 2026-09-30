import { bBaleData, bBaleService, bOrganizationContext } from '@bpcl/fabric';
import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { defer, lastValueFrom, retry } from 'rxjs';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { BaleCreatedEvent } from '../inventory/events/bale-created.event';
import { InventoryService } from '../inventory/inventory.service';
import { BaleReportDTO } from './dto/bale-report.dto';
import { BaleResponseDTO } from './dto/bale-response.dto';
import { CreateBaleDTO } from './dto/create-bale.dto';
import { GetBaleReportDTO } from './dto/get-bale-report.dto';
import { GetBaleDTO } from './dto/get-bale.dto';
import { Bale } from './entities/bale.entity';
import { ProcurePlastic } from '../procure-plastic/entities/procure-plastic.entity';
import { BaleStatus } from './enum/status.enum';
import { randomUUID } from 'crypto';

@Injectable()
export class BaleService {
  private readonly logger = new Logger(BaleService.name);

  private generateTransactionId(): string {
    return randomUUID().substring(0, 8);
  }

  constructor(
    @InjectRepository(Bale)
    private baleRepository: Repository<Bale>,
    @InjectRepository(ProcurePlastic)
    private procurePlasticRepository: Repository<ProcurePlastic>,
    private companyService: CompanyService,
    private authService: AuthService,
    private baleService: bBaleService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => InventoryService))
    private readonly inventoryService: InventoryService,
  ) {}

  async create(createDto: CreateBaleDTO): Promise<BaleResponseDTO> {
    const transactionId = this.generateTransactionId();

    this.logger.log(`[${transactionId}] Starting bale creation process`);
    this.logger.debug(
      `[${transactionId}] Create DTO: ${JSON.stringify(createDto)}`,
    );

    const queryRunner =
      this.baleRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await this.companyService.findById(createDto.companyId);

      await this.authService.findById(createDto.userId);

      if (createDto.procurePlasticId != null) {
        const procurePlastic = await this.procurePlasticRepository.findOne({
          where: { id: createDto.procurePlasticId, companyId: company.id },
        });
        if (!procurePlastic) {
          throw new NotFoundException(
            'Procurement record not found for this company',
          );
        }
      }

      this.logger.log(`[${transactionId}] Company and User validated`);

      const inventorySummary =
        await this.inventoryService.getInventorySummaryReport(company.id);

      this.logger.log(
        `[${transactionId}] Available Raw plastic: ${inventorySummary.rawPlasticWeight}kg`,
      );

      if (
        inventorySummary.rawPlasticWeight < createDto.quantity ||
        inventorySummary.rawPlasticWeight === 0
      ) {
        this.logger.warn(
          `[${transactionId}] Insufficient raw plastic. Available: ${inventorySummary.rawPlasticWeight}kg, Requested: ${createDto.quantity}kg`,
        );
        throw new BadRequestException("You don't have sufficient raw plastic");
      }

      if (createDto.quantity < 0) {
        this.logger.warn(
          `[${transactionId}] Negative bale weight attempted: ${createDto.quantity}kg`,
        );
        throw new BadRequestException("Bale weight can't be negative");
      }

      const baleDisplayId = '001';
      const bale = this.baleRepository.create({
        ...createDto,
        baleDisplayId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createDto.userId,
        updatedBy: createDto.userId,
      });

      const savedBale = await queryRunner.manager.save(bale);
      this.logger.log(
        `[${transactionId}] Bale saved successfully with ID: ${savedBale.id}`,
      );

      // Emit event here
      this.logger.log(
        `[${transactionId}] Emitting bale.created event for updating inventory summary`,
      );
      this.eventEmitter.emit(
        'bale.created',
        new BaleCreatedEvent(
          company.id,
          savedBale.quantity,
          savedBale.packagingType,
          savedBale.productType,
        ),
      );
      this.logger.debug(
        `[${transactionId}] Bale created event emitted successfully`,
      );

      await queryRunner.commitTransaction();

      await this.saveToFabric(bale, company);

      this.logger.log(`[${transactionId}] Bale saved to Fabric successfully`);

      return plainToClass(BaleResponseDTO, {
        ...savedBale,
        companyName: company.name,
      });
    } catch (err) {
      this.logger.error(
        `[${transactionId}] Bale creation failed: ${err.message}`,
        err.stack,
      );
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: GetBaleDTO): Promise<BaleResponseDTO[]> {
    const queryBuilder = this.baleRepository
      .createQueryBuilder('createBale')
      .leftJoinAndSelect('createBale.company', 'company')
      .orderBy('"createBale"."createdAt"', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"createBale"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"createBale"."createdAt" >= :startOfDay AND "createBale"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"createBale"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"createBale"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    if (query.productType && query.productType.toLowerCase() !== 'all') {
      queryBuilder.andWhere('"createBale"."productType" = :baleType', {
        baleType: query.productType,
      });
    }

    const bales = await queryBuilder.getMany();

    return bales.map((bale) =>
      plainToClass(
        BaleResponseDTO,
        {
          ...bale,
          companyName: bale.company.name,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  async findAllCreatedBale(query: GetBaleDTO): Promise<BaleResponseDTO[]> {
    const queryBuilder = this.baleRepository
      .createQueryBuilder('createBale')
      .leftJoinAndSelect('createBale.company', 'company')
      .where('createBale.status = :status', { status: 'Created' })
      .orderBy('"createBale"."createdAt"', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"createBale"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"createBale"."createdAt" >= :startOfDay AND "createBale"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"createBale"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"createBale"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    if (query.productType && query.productType.toLowerCase() !== 'all') {
      queryBuilder.andWhere('"createBale"."productType" = :baleType', {
        baleType: query.productType,
      });
    }

    const bales = await queryBuilder.getMany();

    return bales.map((bale) =>
      plainToClass(
        BaleResponseDTO,
        {
          ...bale,
          companyName: bale.company.name,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  async findAllReceivedBale(): Promise<BaleResponseDTO[]> {
    const queryBuilder = this.baleRepository
      .createQueryBuilder('createBale')
      .leftJoinAndSelect('createBale.company', 'company')
      .where('createBale.status = :status', { status: 'Received' })
      .orderBy('"createBale"."createdAt"', 'DESC');

    const bales = await queryBuilder.getMany();

    return bales.map((bale) =>
      plainToClass(
        BaleResponseDTO,
        {
          ...bale,
          companyName: bale.company.name,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  async findAllShippedBale(): Promise<BaleResponseDTO[]> {
    const queryBuilder = this.baleRepository
      .createQueryBuilder('createBale')
      .leftJoinAndSelect('createBale.company', 'company')
      .where('createBale.status = :status', { status: 'Shipped' })
      .orderBy('"createBale"."createdAt"', 'DESC');

    const bales = await queryBuilder.getMany();

    return bales.map((bale) =>
      plainToClass(
        BaleResponseDTO,
        {
          ...bale,
          companyName: bale.company.name,
        },
        {
          excludeExtraneousValues: true,
        },
      ),
    );
  }

  async getReport(query: GetBaleReportDTO): Promise<BaleReportDTO> {
    const queryBuilder = this.baleRepository
      .createQueryBuilder('createBale')
      .select('COUNT(createBale.id)', 'baleQuantity')
      .addSelect('COALESCE(SUM(createBale.quantity), 0)', 'baleWeight')
      .addSelect(
        `ROUND(
        CASE WHEN SUM(createBale.quantity) > 0 
        THEN ((SUM(CASE WHEN createBale.productType = 'White Bottle' THEN createBale.quantity ELSE 0 END) / SUM(createBale.quantity)) * 100)::numeric
        ELSE 0::numeric END
      , 2)`,
        'whitePercentage',
      )
      .addSelect(
        `ROUND(
        CASE WHEN SUM(createBale.quantity) > 0 
        THEN ((SUM(CASE WHEN createBale.productType = 'Green Bottle' THEN createBale.quantity ELSE 0 END) / SUM(createBale.quantity)) * 100)::numeric 
        ELSE 0::numeric END
      , 2)`,
        'greenPercentage',
      )
      .addSelect(
        `ROUND(
        CASE WHEN SUM(createBale.quantity) > 0 
        THEN ((SUM(CASE WHEN createBale.productType = 'Brown Bottle' THEN createBale.quantity ELSE 0 END) / SUM(createBale.quantity)) * 100)::numeric 
        ELSE 0::numeric END
      , 2)`,
        'brownPercentage',
      )
      .where('createBale.status = :status', { status: BaleStatus.Created });

    if (query.companyId) {
      const company = await this.companyService.findById(query.companyId);
      if (!company) {
        throw new NotFoundException(`Company with given ID not found`);
      }
    }

    if (query.companyId) {
      queryBuilder.andWhere('"createBale"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"createBale"."createdAt" >= :startOfDay AND "createBale"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"createBale"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"createBale"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const bales = await queryBuilder.getRawOne();

    return {
      baleQuantity: Number(bales.baleQuantity),
      baleWeight: Number(bales.baleWeight),
      whitePercentage: Number(bales.whitePercentage),
      greenPercentage: Number(bales.greenPercentage),
      brownPercentage: Number(bales.brownPercentage),
    };
  }

  async getComprehensiveBaleStats(companyId: number) {
    const result = await this.baleRepository
      .createQueryBuilder('bale')
      .select('COALESCE(SUM(bale.quantity), 0)', 'totalConvertedWeight')
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Bale' THEN bale.quantity ELSE 0 END), 0)`,
        'baleWeight',
      )
      .addSelect(
        `COUNT(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Bale' THEN 1 END)`,
        'baleQuantity',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Flakes' THEN bale.quantity ELSE 0 END), 0)`,
        'flakeWeight',
      )
      .addSelect(
        `COUNT(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Flakes' THEN 1 END)`,
        'flakeQuantity',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Bale' AND bale.productType = 'White Bottle' THEN bale.quantity ELSE 0 END), 0)`,
        'whiteBaleWeight',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Bale' AND bale.productType = 'Green Bottle' THEN bale.quantity ELSE 0 END), 0)`,
        'greenBaleWeight',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Bale' AND bale.productType = 'Brown Bottle' THEN bale.quantity ELSE 0 END), 0)`,
        'brownBaleWeight',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Flakes' AND bale.productType = 'White Bottle' THEN bale.quantity ELSE 0 END), 0)`,
        'whiteFlakeWeight',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Flakes' AND bale.productType = 'Green Bottle' THEN bale.quantity ELSE 0 END), 0)`,
        'greenFlakeWeight',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Created' AND bale.packagingType = 'Flakes' AND bale.productType = 'Brown Bottle' THEN bale.quantity ELSE 0 END), 0)`,
        'brownFlakeWeight',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Shipped' AND bale.packagingType = 'Bale' THEN bale.baleShipmentWeight ELSE 0 END), 0)`,
        'shippedBaleWeight',
      )
      .addSelect(
        `COUNT(CASE WHEN bale.status = 'Shipped' AND bale.packagingType = 'Bale' THEN 1 END)`,
        'shippedBaleQuantity',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Shipped' AND bale.packagingType = 'Flakes' THEN bale.baleShipmentWeight ELSE 0 END), 0)`,
        'shippedFlakeWeight',
      )
      .addSelect(
        `COUNT(CASE WHEN bale.status = 'Shipped' AND bale.packagingType = 'Flakes' THEN 1 END)`,
        'shippedFlakeQuantity',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Received' AND bale.packagingType = 'Bale' THEN bale.baleShipmentWeight ELSE 0 END), 0)`,
        'unloadedBaleWeight',
      )
      .addSelect(
        `COUNT(CASE WHEN bale.status = 'Received' AND bale.packagingType = 'Bale' THEN 1 END)`,
        'unloadedBaleQuantity',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Received' AND bale.packagingType = 'Flakes' THEN bale.baleShipmentWeight ELSE 0 END), 0)`,
        'unloadedFlakeWeight',
      )
      .addSelect(
        `COUNT(CASE WHEN bale.status = 'Received' AND bale.packagingType = 'Flakes' THEN 1 END)`,
        'unloadedFlakeQuantity',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status = 'Processed' THEN bale.baleShipmentWeight ELSE 0 END), 0)`,
        'batchWeight',
      )
      .addSelect(
        `COUNT(CASE WHEN bale.status = 'Processed' THEN 1 END)`,
        'baleQuantityInBatch',
      )
      .where('bale.companyId = :companyId', { companyId })
      .getRawOne();

    return {
      totalConvertedWeight: parseFloat(result.totalConvertedWeight) || 0,
      baleWeight: parseFloat(result.baleWeight) || 0,
      baleQuantity: parseInt(result.baleQuantity) || 0,
      flakeWeight: parseFloat(result.flakeWeight) || 0,
      flakeQuantity: parseInt(result.flakeQuantity) || 0,
      whiteBaleWeight: parseFloat(result.whiteBaleWeight) || 0,
      greenBaleWeight: parseFloat(result.greenBaleWeight) || 0,
      brownBaleWeight: parseFloat(result.brownBaleWeight) || 0,
      whiteFlakeWeight: parseFloat(result.whiteFlakeWeight) || 0,
      greenFlakeWeight: parseFloat(result.greenFlakeWeight) || 0,
      brownFlakeWeight: parseFloat(result.brownFlakeWeight) || 0,
      shippedBaleWeight: parseFloat(result.shippedBaleWeight) || 0,
      shippedBaleQuantity: parseInt(result.shippedBaleQuantity) || 0,
      shippedFlakeWeight: parseFloat(result.shippedFlakeWeight) || 0,
      shippedFlakeQuantity: parseInt(result.shippedFlakeQuantity) || 0,
      unloadedBaleWeight: parseFloat(result.unloadedBaleWeight) || 0,
      unloadedBaleQuantity: parseInt(result.unloadedBaleQuantity) || 0,
      unloadedFlakeWeight: parseFloat(result.unloadedFlakeWeight) || 0,
      unloadedFlakeQuantity: parseInt(result.unloadedFlakeQuantity) || 0,
      batchWeight: parseFloat(result.batchWeight) || 0,
      baleQuantityInBatch: parseInt(result.baleQuantityInBatch) || 0,
    };
  }

  async findById(id: number): Promise<BaleResponseDTO> {
    const bale = await this.baleRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!bale) {
      throw new NotFoundException(`Bale with ID ${id} not found`);
    }

    return plainToClass(
      BaleResponseDTO,
      {
        ...bale,
        companyName: bale.company.name,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  private async saveToFabric(bale: Bale, company: Company) {
    // console.log('Saving Bale to Fabric:', bale);
    // console.log('Associated Company:', company);

    const baleData: bBaleData = {
      baleId: bale.id,
      baleDisplayId: bale.baleDisplayId,
      packagingType: bale.packagingType,
      productType: bale.productType,
      quantity: bale.quantity,
      createdAt: bale.createdAt.toISOString(),
      createdBy: bale.createdBy,
      companyId: bale.companyId,
      userId: bale.userId,
      shipmentWeight: bale.baleShipmentWeight ? bale.baleShipmentWeight : 0,
      status: bale.status ? bale.status : 'CREATED',
      latitude: bale.latitude ? bale.latitude : 0,
      longitude: bale.longitude ? bale.longitude : 0,
      procurePlasticId: bale.procurePlasticId,
    };
    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.baleService.createBale(baleData, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }

  private async updateToFabric(bale: Bale, company: Company) {
    const baleData: bBaleData = {
      baleId: bale.id,
      baleDisplayId: bale.baleDisplayId,
      packagingType: bale.packagingType,
      productType: bale.productType,
      quantity: bale.quantity,
      createdAt: bale.createdAt.toISOString(),
      createdBy: bale.createdBy,
      companyId: bale.companyId,
      userId: bale.userId,
      shipmentWeight: bale.baleShipmentWeight,
      status: bale.status,
      latitude: bale.latitude,
      longitude: bale.longitude,
    };
    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.baleService.updateBale(baleData, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }

  async updateBale(
    id: number,
    status: BaleStatus,
    baleShipmentWeight?: number,
  ): Promise<BaleResponseDTO> {
    const bale = await this.baleRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!bale) {
      throw new HttpException(
        `Bale with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (baleShipmentWeight) bale.baleShipmentWeight = baleShipmentWeight;
    bale.status = status;
    bale.updatedAt = new Date();

    const updatedBale = await this.baleRepository.save(bale);
    await this.updateToFabric(bale, bale.company);

    return plainToClass(
      BaleResponseDTO,
      {
        ...updatedBale,
        companyName: bale.company.name,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
