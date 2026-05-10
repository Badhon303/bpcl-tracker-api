import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
  ApiParam,
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
import { AssignBaleInShipmentDTO } from './dto/assign-bale-in-shipment.dto';
import { CreateShipmentDTO } from './dto/create-shipment.dto';
import { GetShipmentDTO } from './dto/get-shipment.dto';
import { ShipmentResponseDTO } from './dto/shipment-response.dto';
import { Shipment } from './entitties/shipment.entity';
import { ShipmentService } from './shipment.service';
import { Status } from './enum/status.enum';

@ApiTags('MakeShipment')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new shipment' })
  @ApiCreatedResponse({
    description: 'The shipment has been successfully created.',
    type: () => SwaggerResponseType(ShipmentResponseDTO),
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
    description: 'Shipment creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createShipmentDto: CreateShipmentDTO,
  ): Promise<Shipment> {
    return await this.shipmentService.create(createShipmentDto);
  }

  @Post('assign-bale')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a bale to a shipment' })
  @ApiCreatedResponse({
    description: 'The bale has been successfully added.',
    type: () => SwaggerResponseType(ShipmentResponseDTO),
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
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Assinging bale to a shipment failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async assignBaleToBatch(
    @Body() dto: AssignBaleInShipmentDTO,
  ): Promise<Shipment> {
    return await this.shipmentService.assignBaleInShipment(dto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all shipments for a company' })
  @ApiOkResponse({
    description: 'List of shipments for the specified company.',
    type: () => SwaggerResponseType(ShipmentResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve shipment records due to a server error.',
  })
  async findAllByCompany(
    @Query() query: GetShipmentDTO,
  ): Promise<ShipmentResponseDTO[]> {
    return await this.shipmentService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single shipment by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the shipment to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The shipment was retrieved successfully.',
    type: () => SwaggerResponseType(ShipmentResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shipment record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOne(@Param('id') id: number): Promise<ShipmentResponseDTO> {
    return await this.shipmentService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a shipment by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the shipment to update',
    example: 1,
  })
  @ApiQuery({
    name: 'status',
    required: true,
    enum: Status,
    description: 'New status for the shipment',
    example: Status.Shipped,
  })
  @ApiOkResponse({
    description: 'The shipment is updated successfully.',
    type: () => SwaggerResponseType(ShipmentResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Shipment record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async update(
    @Param('id') id: number,
    @Query('status') status: Status,
  ): Promise<ShipmentResponseDTO> {
    return await this.shipmentService.updateShipmentStatus(id, status);
  }
}
