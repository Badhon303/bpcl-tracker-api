import {
  bOrganizationContext,
  bProcurementData,
  ProcurementService as bProcurementService,
} from '@bpcl/fabric';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { defer, lastValueFrom, retry } from 'rxjs';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CompanyService } from '../company/company.service';
import { Company } from '../company/entities/company.entity';
import { ProcurePlasticCreatedEvent } from '../inventory/events/procure-plastic-created.event';
import { SupplierResponseDTO } from '../supplier/dto/supplier-response.dto';
import { SupplierService } from '../supplier/supplier.service';
import { CreateProcurePlasticDTO } from './dto/create-procure-plastic.dto';
import { GetProcurePlasticDTO } from './dto/get-procure-plastic.dto';
import { ProcurePlasticReportDTO } from './dto/procure-plastic-report.dto';
import { ProcurePlasticResponseDTO } from './dto/procure-plastic-response.dto';
import { ProcurePlastic } from './entities/procure-plastic.entity';

@Injectable()
export class ProcurePlasticService {
  constructor(
    @InjectRepository(ProcurePlastic)
    private procurePlasticRepository: Repository<ProcurePlastic>,
    private supplierService: SupplierService,
    private companyService: CompanyService,
    private authService: AuthService,
    private bProcurementService: bProcurementService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createDto: CreateProcurePlasticDTO,
  ): Promise<ProcurePlasticResponseDTO> {
    const supplier = await this.supplierService.findById(createDto.supplierId);

    const company = await this.companyService.findById(createDto.companyId);

    await this.authService.findById(createDto.userId);

    const procurePlastic = this.procurePlasticRepository.create({
      ...createDto,
      supplier,
      createdBy: createDto.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: createDto.userId,
    });

    const savedProcurePlastic =
      await this.procurePlasticRepository.save(procurePlastic);

    // Emit event here
    this.eventEmitter.emit(
      'procure-plastic.created',
      new ProcurePlasticCreatedEvent(
        company.id,
        savedProcurePlastic.amberQuantity +
          savedProcurePlastic.mixedPetQuantity +
          savedProcurePlastic.nonPetQuantity,
      ),
    );

    await this.saveToFabric(procurePlastic, company);

    return plainToClass(ProcurePlasticResponseDTO, {
      ...savedProcurePlastic,
      supplier: plainToClass(SupplierResponseDTO, {
        ...savedProcurePlastic.supplier,
        companyName: savedProcurePlastic.supplier.company.name,
        // company: plainToClass(CompanyResponseDTO, {
        //   ...savedProcurePlastic.supplier.company,
        // }),
      }),
    });
  }

  async findAll(
    query: GetProcurePlasticDTO,
  ): Promise<ProcurePlasticResponseDTO[]> {
    const queryBuilder = this.procurePlasticRepository
      .createQueryBuilder('procurePlastic')
      .leftJoinAndSelect('procurePlastic.supplier', 'supplier')
      .leftJoinAndSelect('supplier.company', 'company')
      .orderBy('procurePlastic.createdAt', 'DESC');

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
    }

    if (query.companyId) {
      queryBuilder.andWhere('"procurePlastic"."companyId" = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      queryBuilder.andWhere(
        'procurePlastic.createdAt >= :startOfDay AND procurePlastic.createdAt <= :endOfDay',
        {
          startOfDay,
          endOfDay,
        },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('procurePlastic.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('procurePlastic.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const procurePlastics = await queryBuilder.getMany();

    // Transform to ProcurePlasticResponseDTO
    return procurePlastics.map((procurePlastic) =>
      plainToClass(ProcurePlasticResponseDTO, {
        ...procurePlastic,
        supplier: plainToClass(SupplierResponseDTO, {
          ...procurePlastic.supplier,
          companyName: procurePlastic.supplier.company.name,
          // company: plainToClass(
          //   CompanyResponseDTO,
          //   procurePlastic.supplier.company,
          // ),
        }),
      }),
    );
  }

  async getReport(
    query: GetProcurePlasticDTO,
  ): Promise<ProcurePlasticReportDTO> {
    const queryBuilder = this.procurePlasticRepository
      .createQueryBuilder('procurePlastic')
      .select(
        `SUM(
          COALESCE(procurePlastic.mixedPetQuantity, 0) +
          COALESCE(procurePlastic.nonPetQuantity, 0) +
          COALESCE(procurePlastic.amberQuantity, 0)
        )`,
        'rawPlasticWeight',
      );

    if (query.companyId) {
      await this.companyService.findById(query.companyId);
      queryBuilder.andWhere('procurePlastic.companyId = :companyId', {
        companyId: query.companyId,
      });
    }

    if (query.fromDate && query.toDate && query.fromDate === query.toDate) {
      const startOfDay = new Date(query.fromDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(query.toDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      queryBuilder.andWhere(
        'procurePlastic.createdAt >= :startOfDay AND procurePlastic.createdAt <= :endOfDay',
        { startOfDay, endOfDay },
      );
    } else {
      if (query.fromDate) {
        queryBuilder.andWhere('procurePlastic.createdAt >= :fromDate', {
          fromDate: new Date(query.fromDate),
        });
      }
      if (query.toDate) {
        queryBuilder.andWhere('procurePlastic.createdAt <= :toDate', {
          toDate: new Date(query.toDate),
        });
      }
    }

    const stats = await queryBuilder.getRawOne();

    return {
      rawPlasticWeight: parseFloat(stats.rawPlasticWeight) || 0,
    };
  }

  async findOne(id: number): Promise<ProcurePlasticResponseDTO> {
    const procurePlastic = await this.procurePlasticRepository.findOne({
      where: { id },
      relations: ['supplier', 'supplier.company'],
    });

    if (!procurePlastic) {
      throw new NotFoundException(`Procurement record with given ID not found`);
    }

    return plainToClass(ProcurePlasticResponseDTO, {
      ...procurePlastic,
      supplier: plainToClass(SupplierResponseDTO, {
        ...procurePlastic.supplier,
        companyName: procurePlastic.supplier.company.name,
        // company: plainToClass(
        //   CompanyResponseDTO,
        //   procurePlastic.supplier.company,
        // ),
      }),
    });
  }

  private async saveToFabric(
    procurePlastic: ProcurePlastic,
    company: Company,
  ): Promise<void> {
    const procurementData: bProcurementData = {
      procurementId: procurePlastic.id,
      supplierId: procurePlastic.supplierId,
      mixedPetQuantity: procurePlastic.mixedPetQuantity,
      mixedPetPrice: procurePlastic.mixedPetPrice,
      nonPetQuantity: procurePlastic.nonPetQuantity,
      nonPetPrice: procurePlastic.nonPetPrice,
      amberQuantity: procurePlastic.amberQuantity,
      amberPrice: procurePlastic.amberPrice,
      paymentMethod: procurePlastic.paymentMethod,
      accountNo: procurePlastic.accountNo,
      imageLink: procurePlastic.imageLink,
      companyId: procurePlastic.companyId,
      userId: procurePlastic.userId,
      createdAt: procurePlastic.createdAt?.toISOString(),
      createdBy: procurePlastic.createdBy?.toString(),
      latitude: procurePlastic.latitude,
      longitude: procurePlastic.longitude,
    };
    const orgContext: bOrganizationContext = {
      channelName: company.channelName,
      chaincodeName: company.chaincodeName,
      userOrg: company.peerName,
    };

    const deferred = defer(() =>
      this.bProcurementService.createProcurement(procurementData, orgContext),
    ).pipe(retry({ count: 3, delay: 1000 }));
    await lastValueFrom(deferred);
  }
}
