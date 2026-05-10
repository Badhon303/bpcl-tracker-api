import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreatePreproductShipmentDTO } from './dtos/create-preproduct-shipment.dto';
import { PreproductShipmentResponseDTO } from './dtos/preproduct-shipment-response.dto';
import { PreproductShipmentService } from './preproduct-shipment.service';
import { GetPreproductShipmentDTO } from './dtos/get-preproduct-shipment.dto';

@ApiTags('PreproductShipment')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
@Controller('preproduct-shipment')
export class PreproductShipmentController {
  constructor(
    private readonly preproductShipmentService: PreproductShipmentService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new preproduct shipment' })
  @ApiCreatedResponse({
    description: 'The preproduct shipment has been successfully created.',
    type: () => SwaggerResponseType(PreproductShipmentResponseDTO),
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
    description: 'Preproduct shipment creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createPreproductShipmentDto: CreatePreproductShipmentDTO,
  ): Promise<PreproductShipmentResponseDTO> {
    return await this.preproductShipmentService.create(
      createPreproductShipmentDto,
    );
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all preproduct shipments for a company' })
  @ApiOkResponse({
    description: 'List of preproduct shipments for the specified company.',
    type: () => SwaggerResponseType(PreproductShipmentResponseDTO, true),
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
    @Query() query: GetPreproductShipmentDTO,
  ): Promise<PreproductShipmentResponseDTO[]> {
    return await this.preproductShipmentService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single preproduct shipment by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the preproduct shipment to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The preproduct shipment was retrieved successfully.',
    type: () => SwaggerResponseType(PreproductShipmentResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preproduct shipment record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOne(
    @Param('id') id: number,
  ): Promise<PreproductShipmentResponseDTO> {
    return await this.preproductShipmentService.findById(id);
  }
}
