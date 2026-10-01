import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass, plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CompanyService } from '../company/company.service';
import { SupplierCreatedEvent } from '../inventory/events/supplier-created.event';
import { SupplierDTO } from './dto/register-supplier.dto';
import { SupplierReportDTO } from './dto/supplier-report.dto';
import { SupplierResponseDTO } from './dto/supplier-response.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    private authService: AuthService,
    private companyService: CompanyService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createSupplierDto: SupplierDTO): Promise<SupplierResponseDTO> {
    const queryRunner =
      this.supplierRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const company = await this.companyService.findById(
        createSupplierDto.companyId,
      );

      await this.authService.findById(createSupplierDto.userId);

      const supplierDisplayId = '001';
      const supplier = queryRunner.manager.create(Supplier, {
        ...createSupplierDto,
        supplierDisplayId,
      });

      const saveSupplier = await queryRunner.manager.save(supplier);

      // Emit event here
      this.eventEmitter.emit(
        'supplier.created',
        new SupplierCreatedEvent(company.id),
      );

      await queryRunner.commitTransaction();

      const savedSupplierWithCompany = await this.supplierRepository.findOne({
        where: { id: saveSupplier.id },
        relations: ['company'],
      });

      if (!savedSupplierWithCompany) {
        throw new InternalServerErrorException(
          'Failed to fetch saved supplier with company',
        );
      }

      return plainToClass(SupplierResponseDTO, {
        ...savedSupplierWithCompany,
        companyName: savedSupplierWithCompany.company.name,
        // company: plainToClass(CompanyResponseDTO, {
        //   ...savedSupplierWithCompany.company,
        // }),
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!supplier) {
      throw new NotFoundException('Supplier with the given ID not found');
    }
    return supplier;
  }

  async findAll(
    companyId?: number,
    page?: number,
    limit?: number,
  ): Promise<SupplierResponseDTO[]> {
    if (companyId) {
      await this.companyService.findById(companyId);
    }

    const requestedPage = Number(page);
    const safePage = Number.isFinite(requestedPage)
      ? Math.max(Math.trunc(requestedPage), 1)
      : 1;
    const safeLimit =
      limit !== undefined && Number.isFinite(limit) && limit > 0
        ? Math.max(1, Math.min(Math.trunc(limit), 100))
        : undefined;

    const suppliers = await this.supplierRepository.find({
      where: { companyId },
      relations: ['company'],
      order: {
        supplierName: 'ASC',
        id: 'ASC',
      },
      ...(safeLimit
        ? { skip: (safePage - 1) * safeLimit, take: safeLimit }
        : {}),
    });

    const mappedSuppliers = suppliers.map((supplier) => ({
      ...supplier,
      companyName: supplier.company.name,
    }));

    return plainToInstance(SupplierResponseDTO, mappedSuppliers, {
      excludeExtraneousValues: true,
    });
  }

  async getReport(companyId?: number): Promise<SupplierReportDTO> {
    if (companyId) {
      const company = await this.companyService.findById(companyId);
      if (!company) {
        throw new NotFoundException(`Company with given ID not found`);
      }
    }

    const suppliers = await this.supplierRepository.find({
      where: { companyId: companyId },
    });

    return { totalSupplier: suppliers.length };
  }
}
