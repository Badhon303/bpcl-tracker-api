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
import { CreateProcurePlasticDTO } from './dto/create-procure-plastic.dto';
import { GetProcurePlasticDTO } from './dto/get-procure-plastic.dto';
import { ProcurePlasticResponseDTO } from './dto/procure-plastic-response.dto';
import { ProcurePlasticService } from './procure-plastic.service';

@ApiTags('ProcurePlastic')
@Controller('procure-plastic')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class ProcurePlasticController {
  constructor(private procurePlasticService: ProcurePlasticService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new procument' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Create a new procurement record',
    type: () => SwaggerResponseType(ProcurePlasticResponseDTO),
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
    description: 'Supplier or Company not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Procurement creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createDto: CreateProcurePlasticDTO,
  ): Promise<ProcurePlasticResponseDTO> {
    return this.procurePlasticService.create(createDto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all procurements for a company' })
  @ApiOkResponse({
    description:
      'Retrieve procurement records, optionally filtered by date range',
    type: () => SwaggerResponseType(ProcurePlasticResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'Failed to retrieve procurement records due to a server error.',
  })
  async findAll(
    @Query() query: GetProcurePlasticDTO,
  ): Promise<ProcurePlasticResponseDTO[]> {
    return this.procurePlasticService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single procurement by ID' })
  @ApiOkResponse({
    description: 'Retrieve a specific procurement record by ID',
    type: () => SwaggerResponseType(ProcurePlasticResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Procurement record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Procurement ID' })
  async findOne(@Param('id') id: number): Promise<ProcurePlasticResponseDTO> {
    return this.procurePlasticService.findOne(id);
  }
}
