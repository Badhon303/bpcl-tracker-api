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
import { CreateResinPackageShipmentDTO } from './dtos/create-resin-package-shipment.dto';
import { GetResinPackageShipmentDTO } from './dtos/get-resin-package-shipment.dto';
import { ResinPackageShipmentResponseDTO } from './dtos/resin-package-shipment-response.dto';
import { ResinPackageShipmentService } from './resin-package-shipment.service';

@ApiTags('ResinPackageShipment')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
@Controller('resin-package-shipment')
export class ResinPackageShipmentController {
  constructor(
    private readonly resinPackageShipmentService: ResinPackageShipmentService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new resin package shipment' })
  @ApiCreatedResponse({
    description: 'The resin package shipment has been successfully created.',
    type: () => SwaggerResponseType(ResinPackageShipmentResponseDTO),
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
    description:
      'Resin package shipment creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createResinPackageShipmentDto: CreateResinPackageShipmentDTO,
  ): Promise<ResinPackageShipmentResponseDTO> {
    return await this.resinPackageShipmentService.create(
      createResinPackageShipmentDto,
    );
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all resin package shipments for a company' })
  @ApiOkResponse({
    description: 'List of resin package shipments for the specified company.',
    type: () => SwaggerResponseType(ResinPackageShipmentResponseDTO, true),
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
    @Query() query: GetResinPackageShipmentDTO,
  ): Promise<ResinPackageShipmentResponseDTO[]> {
    return await this.resinPackageShipmentService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single resin package shipment by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the resin package shipment to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The preproduct shipment was retrieved successfully.',
    type: () => SwaggerResponseType(ResinPackageShipmentResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resin package shipment record not found',
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
  ): Promise<ResinPackageShipmentResponseDTO> {
    return await this.resinPackageShipmentService.findById(id);
  }
}
