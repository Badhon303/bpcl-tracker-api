import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { CompanyService } from '../company/company.service';
import { DriverCreatedEvent } from '../inventory/events/driver-created.event';
import { RegisterDriverDTO } from './dto/register-driver.dto';
import { RegisterVehicleDTO } from './dto/register-vehicle.dto';
import { RegisterDriver } from './entity/register-driver.entity';
import { RegisterVehicle } from './entity/register-vehicle.entity';

@Injectable()
export class TransportService {
  constructor(
    @InjectRepository(RegisterDriver)
    private registerDriverRepository: Repository<RegisterDriver>,
    @InjectRepository(RegisterVehicle)
    private registerVehicleRepository: Repository<RegisterVehicle>,
    private companyService: CompanyService,
    private authService: AuthService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(registerDriverDto: RegisterDriverDTO): Promise<RegisterDriver> {
    const company = await this.companyService.findById(
      registerDriverDto.companyId,
    );

    await this.authService.findById(registerDriverDto.userId);

    const registerDriver =
      this.registerDriverRepository.create(registerDriverDto);
    const savedDriver =
      await this.registerDriverRepository.save(registerDriver);

    // Emit event here
    this.eventEmitter.emit(
      'driver.created',
      new DriverCreatedEvent(company.id),
    );

    return savedDriver;
  }

  async findAllDriver(
    companyId?: number,
    page?: number,
    limit?: number,
  ): Promise<RegisterDriver[]> {
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

    return await this.registerDriverRepository.find({
      where: { companyId },
      order: {
        driverName: 'ASC',
        id: 'ASC',
      },
      ...(safeLimit
        ? { skip: (safePage - 1) * safeLimit, take: safeLimit }
        : {}),
    });
  }

  async findDriverById(id: number): Promise<RegisterDriver> {
    const driver = await this.registerDriverRepository.findOne({
      where: { id },
    });
    if (!driver) {
      throw new NotFoundException('Driver with the given ID not found');
    }
    return driver;
  }

  async createVehicle(
    registerVehicleDto: RegisterVehicleDTO,
  ): Promise<RegisterVehicle> {
    await this.companyService.findById(registerVehicleDto.companyId);

    await this.authService.findById(registerVehicleDto.userId);

    const brtcNumber = await this.registerVehicleRepository.findOne({
      where: { brtcNumber: registerVehicleDto.brtcNumber },
    });

    if (brtcNumber) {
      throw new ConflictException('BRTC number number already exists');
    }

    const registerVehicle =
      this.registerVehicleRepository.create(registerVehicleDto);
    const savedVehicle =
      await this.registerVehicleRepository.save(registerVehicle);

    return savedVehicle;
  }

  async findAllVehicle(
    companyId?: number,
    page?: number,
    limit?: number,
  ): Promise<RegisterVehicle[]> {
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

    return await this.registerVehicleRepository.find({
      where: { companyId },
      order: {
        brtcNumber: 'ASC',
        id: 'ASC',
      },
      ...(safeLimit
        ? { skip: (safePage - 1) * safeLimit, take: safeLimit }
        : {}),
    });
  }

  async findVehicleById(id: number): Promise<RegisterVehicle> {
    const vehicle = await this.registerVehicleRepository.findOne({
      where: { id },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle with the given ID not found');
    }
    return vehicle;
  }
}
