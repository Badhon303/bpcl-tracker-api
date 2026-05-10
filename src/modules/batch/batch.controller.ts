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
import { BatchService } from './batch.service';
import { AssignBaleToBatchDTO } from './dto/assign-bale-to-batch.dto.';
import { BatchResponseDTO } from './dto/batch-response.dto';
import { CreateBatchDTO } from './dto/create-batch.dto';
import { GetBatchDTO } from './dto/get-batch.dto';

@ApiTags('Batch')
@Controller('batches')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new batch' })
  @ApiCreatedResponse({
    description: 'The batch has been successfully created.',
    type: () => SwaggerResponseType(BatchResponseDTO),
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
    description: 'Batch creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createBatchDto: CreateBatchDTO,
  ): Promise<BatchResponseDTO> {
    return await this.batchService.create(createBatchDto);
  }

  @Post('assign-bale')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a bale to a batch' })
  @ApiCreatedResponse({
    description: 'The bale has been successfully added.',
    type: () => SwaggerResponseType(BatchResponseDTO),
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
    description: 'Assinging bale to a batch failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async assignBaleToBatch(
    @Body() dto: AssignBaleToBatchDTO,
  ): Promise<BatchResponseDTO> {
    return await this.batchService.assignBaleToBatch(dto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all batches for a company' })
  @ApiOkResponse({
    description: 'List of batches for the specified company.',
    type: () => SwaggerResponseType(BatchResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve batch records due to a server error.',
  })
  async findAllByCompany(
    @Query() query: GetBatchDTO,
  ): Promise<BatchResponseDTO[]> {
    return await this.batchService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single batch by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the batch to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The batch was retrieved successfully.',
    type: () => SwaggerResponseType(BatchResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOne(@Param('id') id: number): Promise<BatchResponseDTO> {
    return await this.batchService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a batch by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the batch to update',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The batch is updated successfully.',
    type: () => SwaggerResponseType(BatchResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Batch record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async update(@Param('id') id: number): Promise<BatchResponseDTO> {
    return await this.batchService.updateBatch(id);
  }
}
