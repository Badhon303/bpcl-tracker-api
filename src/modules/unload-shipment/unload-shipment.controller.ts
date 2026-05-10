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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BpclRequestLogInterceptor,
  SwaggerResponseType,
  TransformInterceptor,
} from 'bpcl/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUnloadShipmentDTO } from './dto/create-unload-shipment.dto';
import { GetUnloadShipmentDTO } from './dto/get-unload-shipment.dto';
import { UnloadShipmentResponseDTO } from './dto/unload-shipment-response.dto';
import { UnloadShippedBaleDTO } from './dto/unload-shipped-bale.dto';
import { updatedUnloadShipmentDTO } from './dto/update-unload-shipment.dto';
import { UnloadShipment } from './entities/unload-shipment.entity';
import { UnloadShipmentService } from './unload-shipment.service';

@ApiTags('UnloadShipment')
@Controller('unload-shipments')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class UnloadShipmentController {
  constructor(private readonly unloadShipmentService: UnloadShipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Unload a new shipment' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'The shipment has been unloaded successfully.',
    type: () => SwaggerResponseType(UnloadShipmentResponseDTO),
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
    description: 'Shipment unload failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createUnloadShipmentDto: CreateUnloadShipmentDTO,
  ): Promise<UnloadShipment> {
    return await this.unloadShipmentService.create(createUnloadShipmentDto);
  }

  @Post('unload-bale')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Unload a bale from a shipment' })
  @ApiCreatedResponse({
    description: 'The bale has been successfully unloaded.',
    type: () => SwaggerResponseType(UnloadShipmentResponseDTO),
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
    description: 'Unloading bale from a shipment failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async assignBaleToBatch(
    @Body() dto: UnloadShippedBaleDTO,
  ): Promise<UnloadShipment> {
    return await this.unloadShipmentService.unloadShippedBale(dto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all unloaded shipments for a company' })
  @ApiOkResponse({
    description: 'List of unloaded shipments for the specified company.',
    type: () => SwaggerResponseType(UnloadShipmentResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'Failed to retrieve unloaded shipment records due to a server error.',
  })
  async findAllByCompany(
    @Query() query: GetUnloadShipmentDTO,
  ): Promise<UnloadShipmentResponseDTO[]> {
    return await this.unloadShipmentService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single unloaded shipment by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the unloaded shipment to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The unloaded shipment was retrieved successfully.',
    type: () => SwaggerResponseType(UnloadShipmentResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Unloaded shipment record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOne(@Param('id') id: number): Promise<UnloadShipmentResponseDTO> {
    return await this.unloadShipmentService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the unloaded shipment to update',
    example: 1,
  })
  @ApiOperation({ summary: 'Update a unload shipment by ID' })
  @ApiOkResponse({
    description: 'The unload shipment is updated successfully.',
    type: () => SwaggerResponseType(UnloadShipmentResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Unload shipment record not found',
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
    @Body() updateUnloadShipmentDto: updatedUnloadShipmentDTO,
  ): Promise<UnloadShipmentResponseDTO> {
    return await this.unloadShipmentService.updateUnloadShipment(
      id,
      updateUnloadShipmentDto,
    );
  }
}
