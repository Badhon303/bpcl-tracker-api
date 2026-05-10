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
import { BaleService } from './bale.service';
import { BaleResponseDTO } from './dto/bale-response.dto';
import { CreateBaleDTO } from './dto/create-bale.dto';
import { GetBaleDTO } from './dto/get-bale.dto';

@ApiTags('Bale')
@Controller('bale')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class BaleController {
  constructor(private baleService: BaleService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new bale' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Create a new bale record',
    type: () => SwaggerResponseType(BaleResponseDTO),
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
    description: 'Company or User not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Bale creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() createDto: CreateBaleDTO): Promise<BaleResponseDTO> {
    return this.baleService.create(createDto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all all bale for a company' })
  @ApiOkResponse({
    description: 'Retrieve bale records, optionally filtered by date range',
    type: () => SwaggerResponseType(BaleResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve bale records due to a server error.',
  })
  async findAll(@Query() query: GetBaleDTO): Promise<BaleResponseDTO[]> {
    return this.baleService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single bale by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'ID of the bale to retrieve',
    example: '1',
  })
  @ApiOkResponse({
    description: 'The bale was retrieved successfully.',
    type: () => SwaggerResponseType(BaleResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bale record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOne(@Param('id') id: number): Promise<BaleResponseDTO> {
    return await this.baleService.findById(id);
  }
}
