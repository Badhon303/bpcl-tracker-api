import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BpclRequestLogInterceptor,
  SwaggerResponseType,
  TransformInterceptor,
} from 'bpcl/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DriverResponseDTO } from './dto/driver-response.dto';
import { RegisterDriverDTO } from './dto/register-driver.dto';
import { RegisterVehicleDTO } from './dto/register-vehicle.dto';
import { VehicleResponseDTO } from './dto/vehicle-response.dto';
import { RegisterDriver } from './entity/register-driver.entity';
import { RegisterVehicle } from './entity/register-vehicle.entity';
import { TransportService } from './transport.service';

@ApiTags('Transport')
@Controller('transport')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('register-drivers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new driver' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Creates a new driver record with details.',
    type: () => SwaggerResponseType(DriverResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or Company not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Driver registration failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createRegisterDriverDto: RegisterDriverDTO,
  ): Promise<RegisterDriver> {
    return this.transportService.create(createRegisterDriverDto);
  }

  @Get('drivers/get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all drivers for a company' })
  @ApiOkResponse({
    description: 'Retrieves a list of all driver records.',
    type: () => SwaggerResponseType(DriverResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve driver records due to a server error.',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'Filter drivers by company ID',
    type: Number,
  })
  async findAll(
    @Query('companyId') companyId?: number,
  ): Promise<RegisterDriver[]> {
    return this.transportService.findAllDriver(companyId);
  }

  @Post('register-vehicles')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new vehicle' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Creates a new vehicle record with details.',
    type: () => SwaggerResponseType(VehicleResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or Company not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Vehicle registration failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createVehicle(
    @Body() createRegisterVehicleDto: RegisterVehicleDTO,
  ): Promise<RegisterVehicle> {
    return this.transportService.createVehicle(createRegisterVehicleDto);
  }

  @Get('vehicles/get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all vehicles for a company' })
  @ApiOkResponse({
    description: 'Retrieves a list of all vehicle records.',
    type: () => SwaggerResponseType(VehicleResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve vehicle records due to a server error.',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'Filter vehicles by company ID',
    type: Number,
  })
  async findAllVehicles(
    @Query('companyId') companyId?: number,
  ): Promise<RegisterVehicle[]> {
    return this.transportService.findAllVehicle(companyId);
  }
}
