import {
  bBaleService,
  bOrganizationContext,
  bShipmentData,
  bShipmentService,
} from '@bpcl/fabric';
import {
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
import { plainToClass } from 'class-transformer';
import { defer, lastValueFrom, retry } from 'rxjs';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { BaleService } from '../bale/bale.service';
import { BaleStatus } from '../bale/enum/status.enum';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { ShipmentCreatedEvent } from '../inventory/events/shipment-created.event';
import { TransportService } from '../transport/transport.service';
import { AssignBaleInShipmentDTO } from './dto/assign-bale-in-shipment.dto';
import { CreateShipmentDTO } from './dto/create-shipment.dto';
import { GetShipmentReportDTO } from './dto/get-shipment-report.dto';
import { GetShipmentDTO } from './dto/get-shipment.dto';
import { ShipmentReportDTO } from './dto/shipment-report.dto';
import { ShipmentResponseDTO } from './dto/shipment-response.dto';
import { ShipmentBale } from './entitties/shipment-bale.entity';
import { Shipment } from './entitties/shipment.entity';
import { Status } from './enum/status.enum';

@Injectable()
export class ShipmentService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(ShipmentBale)
    private shipmentBaleRepository: Repository<ShipmentBale>,
    private companyService: CompanyService,
    private authService: AuthService,
    private transportService: TransportService,
    private bShipmentService: bShipmentService,
    private bBaleService: bBaleService,
    @Inject(forwardRef(() => BaleService))
    private readonly baleService: BaleService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createShipmentDto: CreateShipmentDTO): Promise<Shipment> {
    const queryRunner =
      this.shipmentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Parallelize all external service calls
      const [company, user, driver, vehicle] = await Promise.all([
        this.companyService.findById(createShipmentDto.companyId),
        this.authService.findById(createShipmentDto.userId),
        createShipmentDto.driverId
          ? this.transportService.findDriverById(createShipmentDto.driverId)
          : Promise.resolve(null),
        createShipmentDto.vehicleId
          ? this.transportService.findVehicleById(createShipmentDto.vehicleId)
          : Promise.resolve(null),
      ]);

      const shipment = this.shipmentRepository.create({
        ...createShipmentDto,
        totalBales: 0,
        totalWeight: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createShipmentDto.userId,
        updatedBy: createShipmentDto.userId,
      });

      const savedShipment = await queryRunner.manager.save(shipment);
      savedShipment.shipmentDisplayId = this.formatShipmentDisplayId(
        savedShipment.id,
      );
      await queryRunner.manager.save(savedShipment);

      await queryRunner.commitTransaction();

      const result = await this.shipmentRepository.findOne({
        where: { id: savedShipment.id },
        relations: ['shipmentBales', 'shipmentBales.bale', 'driver', 'vehicle'],
      });

      if (!result) {
        throw new HttpException(
          'Failed to retrieve created shipment',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.saveToFabric(result, company);
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async assignBaleInShipment(dto: AssignBaleInShipmentDTO): Promise<Shipment> {
    const { shipmentId, baleId, baleShipmentWeight } = dto;

    const bale = await this.baleService.findById(baleId);
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
    });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    const company = await this.companyService.findById(shipment.companyId);

    const existing = await this.shipmentBaleRepository.findOne({
      where: { baleId },
    });

    if (existing) {
      throw new ConflictException(`Bale is already assigned to a shipment`);
    }

    await this.shipmentBaleRepository.save({
      shipmentId,
      baleId,
      baleShipmentWeight,
    });

    shipment.totalBales = (shipment.totalBales || 0) + 1;
    shipment.totalWeight = (shipment.totalWeight || 0) + dto.baleShipmentWeight;
    shipment.shipmentDisplayId = this.formatShipmentDisplayId(shipment.id);
    shipment.updatedAt = new Date();
    await this.shipmentRepository.save(shipment);

    await this.baleService.updateBale(
      baleId,
      BaleStatus.Shipped,
      dto.baleShipmentWeight,
    );

    // Emit event here
    this.eventEmitter.emit(
      'shipment.created',
      new ShipmentCreatedEvent(
        shipment.companyId,
        bale.packagingType,
        bale.quantity,
        dto.baleShipmentWeight,
        bale.productType,
      ),
    );

    const result = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['shipmentBales', 'shipmentBales.bale', 'driver', 'vehicle'],
    });

    if (!result) {
      throw new HttpException(
        'Failed to retrieve created batch',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    this.updateToFabric(
      shipmentId,
      baleId,
      bale.companyId,
      baleShipmentWeight,
      company,
    );

    return result;
  }

  async findAllByCompany(
    query: GetShipmentDTO,
  ): Promise<ShipmentResponseDTO[]> {
    const queryBuilder = this.shipmentRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.shipmentBales', 'shipmentBales')
      .leftJoinAndSelect('shipmentBales.bale', 'bale')
      .leftJoinAndSelect('shipment.driver', 'driver')
      .leftJoinAndSelect('shipment.vehicle', 'vehicle')
      .orderBy('shipment.createdAt', 'DESC')
      .addOrderBy('shipment.id', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.status) {
      queryBuilder.andWhere('"shipment"."status" = :status', {
        status: query.status,
      });
    }

    if (query.companyId) {
      queryBuilder.andWhere('"shipment"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"shipment"."createdAt" >= :startOfDay AND "shipment"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"shipment"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"shipment"."createdAt" <= :toDate', {
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

    const shipments = await queryBuilder.getMany();

    return shipments.map((shipment) => this.toShipmentResponse(shipment));
  }

  async getShipmentReport(
    query: GetShipmentReportDTO,
  ): Promise<ShipmentReportDTO> {
    const queryBuilder = this.shipmentRepository
      .createQueryBuilder('shipment')
      .leftJoin('shipment.shipmentBales', 'shipmentBales')
      .leftJoin('shipmentBales.bale', 'bale')
      .select(
        `COALESCE(COUNT(CASE WHEN bale.status != 'Created' THEN 1 END), 0)`,
        'shippedBaleCount',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN bale.status != 'Created' THEN bale.quantity ELSE 0 END), 0)`,
        'totalShippedBaleWeight',
      );

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"shipment"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"shipment"."createdAt" >= :startOfDay AND "shipment"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"shipment"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"shipment"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const stats = await queryBuilder.getRawOne();

    return {
      totalBaleShipments: parseFloat(stats.shippedBaleCount) || 0,
      totalShippedBaleWeight: parseFloat(stats.totalShippedBaleWeight) || 0,
    };
  }

  async findById(id: number): Promise<ShipmentResponseDTO> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['shipmentBales', 'shipmentBales.bale', 'driver', 'vehicle'],
    });

    if (!shipment) {
      throw new NotFoundException('Shipment with the given ID not found');
    }

    return this.toShipmentResponse(shipment);
  }

  private toShipmentResponse(shipment: Shipment): ShipmentResponseDTO {
    return plainToClass(ShipmentResponseDTO, {
      ...shipment,
      shipmentDisplayId: this.formatShipmentDisplayId(shipment.id),
    });
  }

  private formatShipmentDisplayId(id: number): string {
    return id.toString().padStart(3, '0');
  }

  private async saveToFabric(result: any, company: Company): Promise<void> {
    const shipmentData: bShipmentData = {
      shipmentId: result.id,
      shipmentDisplayId: result.shipmentDisplayId,
      shipmentType: result.shipmentType,
      driverId: result.driverId || undefined,
      vehicleId: result.vehicleId || undefined,
      baleIds: result.baleIds || [],
      timestamp: result.createdAt?.toISOString() || new Date().toISOString(),
    };

    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bShipmentService.createShipment(shipmentData, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));

    await lastValueFrom(deferred);
  }

  async updateShipmentStatus(
    id: number,
    status: Status,
  ): Promise<ShipmentResponseDTO> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['shipmentBales', 'shipmentBales.bale', 'driver', 'vehicle'],
    });

    if (!shipment) {
      throw new HttpException(
        `Shipment with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    shipment.status = status;
    shipment.shipmentDisplayId = this.formatShipmentDisplayId(shipment.id);
    shipment.updatedAt = new Date();

    const updatedShipment = await this.shipmentRepository.save(shipment);

    return this.toShipmentResponse(updatedShipment);
  }

  private async updateToFabric(
    shipmentId: number,
    baleId: number,
    baleCompanyId: number,
    baleShipmentWeight: number,
    company: Company,
  ): Promise<void> {
    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bShipmentService.addBaleToShipment(
        shipmentId,
        baleId,
        baleShipmentWeight,
        orgContext,
      ),
    ).pipe(retry({ count: 3, delay: 1000 }));

    await lastValueFrom(deferred);
  }
}
