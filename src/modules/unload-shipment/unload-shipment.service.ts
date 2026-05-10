import {
  bBaleService,
  bOrganizationContext,
  bUnloadShipmentData,
  bUnloadShipmentService,
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
import { UnloadShipmentCreatedEvent } from '../inventory/events/unload-shipment-created.event';
import { ShipmentService } from '../shipment/shipment.service';
import { BaleReportDTO } from './dto/bale-report.dto';
import { CreateUnloadShipmentDTO } from './dto/create-unload-shipment.dto';
import { GetUnloadShipmentDTO } from './dto/get-unload-shipment.dto';
import { UnloadShipmentResponseDTO } from './dto/unload-shipment-response.dto';
import { UnloadShippedBaleDTO } from './dto/unload-shipped-bale.dto';
import { UnloadShipmentBale } from './entities/unload-shipment-bale.entity';
import { UnloadShipment } from './entities/unload-shipment.entity';
import { Status } from '../shipment/enum/status.enum';
import { updatedUnloadShipmentDTO } from './dto/update-unload-shipment.dto';
import { UnloadStatus } from './enum/status.enum';

@Injectable()
export class UnloadShipmentService {
  constructor(
    @InjectRepository(UnloadShipment)
    private unloadShipmentRepository: Repository<UnloadShipment>,
    @InjectRepository(UnloadShipmentBale)
    private unloadShipmentBaleRepository: Repository<UnloadShipmentBale>,
    private companyService: CompanyService,
    private authService: AuthService,
    private shipmentService: ShipmentService,
    private bUnloadService: bUnloadShipmentService,
    private bBaleService: bBaleService,
    @Inject(forwardRef(() => BaleService))
    private readonly baleService: BaleService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async create(
    createUnloadShipmentDto: CreateUnloadShipmentDTO,
  ): Promise<UnloadShipment> {
    const queryRunner =
      this.unloadShipmentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Parallelize external service calls
      const [company_bpcl, user, shipment] = await Promise.all([
        this.companyService.findById(createUnloadShipmentDto.companyId),
        this.authService.findById(createUnloadShipmentDto.userId),
        this.shipmentService.findById(createUnloadShipmentDto.shipmentId),
      ]);

      const existingUnload = await queryRunner.manager.findOne(UnloadShipment, {
        where: { shipmentId: createUnloadShipmentDto.shipmentId },
      });

      if (existingUnload) {
        throw new ConflictException(
          `Shipment with given ID has already been unloaded.`,
        );
      }

      // const totalBaleShipmentWeight = baleIds.reduce((total, baleId) => {
      //   return total + shippedBaleMap[baleId].baleShipmentWeight;
      // }, 0);

      // const receivedShipmentWeight =
      //   createUnloadShipmentDto.totalWeightBeforeUnload -
      //   createUnloadShipmentDto.totalWeightAfterUnload;

      // 1% of total bale shipment weight (Threshold value)
      // const hundred = 100.0;
      // const percentage = parseFloat(
      //   (totalBaleShipmentWeight / hundred).toFixed(2),
      // );

      // if (
      //   Math.abs(totalBaleShipmentWeight - receivedShipmentWeight) > percentage
      // ) {
      //   throw new ConflictException(
      //     'Total bale shipment weight and received bale shipment weight differ by more than 1%',
      //   );
      // }

      const unloadShipment = queryRunner.manager.create(UnloadShipment, {
        ...createUnloadShipmentDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: createUnloadShipmentDto.userId,
        updatedBy: createUnloadShipmentDto.userId,
      });

      const savedUnloadShipment =
        await queryRunner.manager.save(unloadShipment);

      const company = await this.companyService.findById(shipment.companyId);

      this.shipmentService.updateShipmentStatus(
        createUnloadShipmentDto.shipmentId,
        Status.Received,
      );

      await queryRunner.commitTransaction();

      const result = await this.unloadShipmentRepository.findOne({
        where: { id: savedUnloadShipment.id },
        relations: [
          'shipment',
          'shipment.driver',
          'shipment.vehicle',
          'unloadShipmentBales',
          'unloadShipmentBales.bale',
        ],
      });

      if (!result) {
        throw new HttpException(
          'Failed to retrieve unload shipment',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.saveToFabric(unloadShipment, company);

      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async unloadShippedBale(dto: UnloadShippedBaleDTO): Promise<UnloadShipment> {
    const { unloadShipmentId, baleId } = dto;
    const bale = await this.baleService.findById(baleId);
    const unloadShipment = await this.unloadShipmentRepository.findOne({
      where: { id: unloadShipmentId },
    });
    if (!unloadShipment) {
      throw new NotFoundException('Unload shipment not found');
    }

    const existing = await this.unloadShipmentBaleRepository.findOne({
      where: { baleId },
    });

    if (existing) {
      throw new ConflictException(`Bale is already unloaded`);
    }


    const company = await this.companyService.findById(
      bale.companyId,
    );


    

    const shipment = await this.shipmentService.findById(
      unloadShipment.shipmentId,
    );
    const shipmentBaleIds = shipment.shipmentBales.map(
      (shipmentBale) => shipmentBale.baleId,
    );

    const exists = shipmentBaleIds.includes(baleId);

    if (!exists) {
      throw new ConflictException(
        `The bale is not associated with this shipment`,
      );
    }

    await this.unloadShipmentBaleRepository.save({
      unloadShipmentId,
      baleId,
    });

    await this.baleService.updateBale(baleId, BaleStatus.Received);

    // Emit event here
    this.eventEmitter.emit(
      'unload-shipment.created',
      new UnloadShipmentCreatedEvent(
        unloadShipment.companyId,
        bale.packagingType,
        bale.baleShipmentWeight,
      ),
    );

    const result = await this.unloadShipmentRepository.findOne({
      where: { id: unloadShipmentId },
      relations: [
        'shipment',
        'shipment.driver',
        'shipment.vehicle',
        'unloadShipmentBales',
        'unloadShipmentBales.bale',
      ],
    });

    if (!result) {
      throw new HttpException(
        'Failed to retrieve created batch',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.updateToFabric(unloadShipmentId, baleId, company);

    return result;
  }

  async findAllByCompany(
    query: GetUnloadShipmentDTO,
  ): Promise<UnloadShipmentResponseDTO[]> {
    const queryBuilder = this.unloadShipmentRepository
      .createQueryBuilder('unloadShipment')
      .leftJoinAndSelect('unloadShipment.shipment', 'shipment')
      .leftJoinAndSelect('shipment.driver', 'driver')
      .leftJoinAndSelect('shipment.vehicle', 'vehicle')
      .leftJoinAndSelect(
        'unloadShipment.unloadShipmentBales',
        'unloadShipmentBales',
      )
      .leftJoinAndSelect('unloadShipmentBales.bale', 'bale')
      .orderBy('"unloadShipment"."createdAt"', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"unloadShipment"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        '"unloadShipment"."createdAt" >= :startOfDay AND "unloadShipment"."createdAt" <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('"unloadShipment"."createdAt" >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('"unloadShipment"."createdAt" <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const unloadShipments = await queryBuilder.getMany();

    return unloadShipments.map((unloadShipment) =>
      plainToClass(UnloadShipmentResponseDTO, {
        ...unloadShipment,
        totalBales: unloadShipment.unloadShipmentBales.length,
        receivedShipmentWeight:
          unloadShipment.totalWeightBeforeUnload -
          unloadShipment.totalWeightAfterUnload,
      }),
    );
  }

  async getBaleReport(query: GetUnloadShipmentDTO): Promise<BaleReportDTO> {
    const queryBuilder = this.unloadShipmentRepository
      .createQueryBuilder('unloadShipment')
      .leftJoin('unloadShipment.unloadShipmentBales', 'unloadShipmentBales')
      .leftJoin('unloadShipmentBales.bale', 'bale')
      .select('COUNT(DISTINCT unloadShipmentBales.id)', 'baleQuantity')
      .addSelect('COALESCE(SUM(bale.baleShipmentWeight), 0)', 'baleWeight')
      .where('bale.status = :status', { status: BaleStatus.Received });

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
      queryBuilder.andWhere('unloadShipment.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      queryBuilder.andWhere(
        'unloadShipment.createdAt >= :startOfDay AND unloadShipment.createdAt <= :endOfDay',
        { startOfDay, endOfDay },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('unloadShipment.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('unloadShipment.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const stats = await queryBuilder.getRawOne();

    return {
      baleQuantity: parseFloat(stats.baleQuantity) || 0,
      baleWeight: parseFloat(stats.baleWeight) || 0,
    };
  }

  async findOne(id: number): Promise<UnloadShipmentResponseDTO> {
    const unloadShipment = await this.unloadShipmentRepository.findOne({
      where: { id },
      relations: [
        'shipment',
        'shipment.driver',
        'shipment.vehicle',
        'unloadShipmentBales',
        'unloadShipmentBales.bale',
      ],
    });

    if (!unloadShipment) {
      throw new HttpException(
        'Unloaded shipment not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const totalBales = unloadShipment.unloadShipmentBales.length;

    const receivedShipmentWeight =
      unloadShipment.totalWeightBeforeUnload -
      unloadShipment.totalWeightAfterUnload;

    return plainToClass(UnloadShipmentResponseDTO, {
      ...unloadShipment,
      totalBales,
      receivedShipmentWeight,
    });
  }

  private async saveToFabric(
    unload: UnloadShipment,
    company: Company,
  ): Promise<void> {
    const totalWeightAfterUnload = unload.totalWeightAfterUnload ?? 0;
    const unloadData: bUnloadShipmentData = {
      id: unload.id,
      shipmentId: unload.shipmentId,
      totalBales: 0,
      totalWeightBeforeUnload: unload.totalWeightBeforeUnload,
      totalWeightAfterUnload: totalWeightAfterUnload,
      receivedShipmentWeight:
      unload.totalWeightBeforeUnload - totalWeightAfterUnload,
      createdAt: unload.createdAt,
      createdBy: unload.createdBy,
      companyId: unload.companyId,
      userId: unload.userId,
      baleIds: [],
      unloadingNote: unload.unloadingNote || '',
    };
    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bUnloadService.createUnloadShipment(unloadData, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }

  async updateUnloadShipment(
    id: number,
    updateUnloadShipmentDto: updatedUnloadShipmentDTO,
  ): Promise<UnloadShipmentResponseDTO> {
    const unloadShipment = await this.unloadShipmentRepository.findOne({
      where: { id },
      relations: [
        'shipment',
        'shipment.driver',
        'shipment.vehicle',
        'unloadShipmentBales',
        'unloadShipmentBales.bale',
      ],
    });

    if (!unloadShipment) {
      throw new HttpException(
        `Unload shipment with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    unloadShipment.totalWeightAfterUnload =
      updateUnloadShipmentDto.totalWeightAfterUnload;
    if (updateUnloadShipmentDto.unloadingNote) {
      unloadShipment.unloadingNote = updateUnloadShipmentDto.unloadingNote;
    }
    unloadShipment.status = UnloadStatus.Completed;
    unloadShipment.updatedAt = new Date();

    const updatedUnloadShipment =
      await this.unloadShipmentRepository.save(unloadShipment);

    const totalBales = unloadShipment.unloadShipmentBales.length;

    const receivedShipmentWeight =
      updatedUnloadShipment.totalWeightBeforeUnload -
      updatedUnloadShipment.totalWeightAfterUnload;

    return plainToClass(UnloadShipmentResponseDTO, {
      ...updatedUnloadShipment,
      totalBales,
      receivedShipmentWeight,
    });
  }

  private async updateToFabric(
    unloadShipmentId: number,
    baleId: number,
    company: Company,
  ): Promise<void> {
    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bUnloadService.addBaleToUnloadShipment(
        unloadShipmentId,
        baleId,
        orgContext,
      ),
    ).pipe(retry({ count: 3, delay: 1000 }));

    await lastValueFrom(deferred);
  }
}
