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
import { CreateLotDTO } from './dtos/create-lot.dto';
import { LotResponseDTO } from './dtos/lot-response.dto';
import { LotService } from './lot.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import {
  TransformInterceptor,
  BpclRequestLogInterceptor,
  SwaggerResponseType,
} from 'bpcl/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetLotDTO } from './dtos/get-lot.dto';

@ApiTags('Lot')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
@Controller('lot')
export class LotController {
  constructor(private readonly lotService: LotService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new lot' })
  @ApiCreatedResponse({
    description: 'The lot has been successfully created.',
    type: () => SwaggerResponseType(LotResponseDTO),
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
    description: 'Lot creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() createLotDto: CreateLotDTO): Promise<LotResponseDTO> {
    return await this.lotService.create(createLotDto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all lots for a company' })
  @ApiOkResponse({
    description: 'List of lots for the specified company.',
    type: () => SwaggerResponseType(LotResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve lot records due to a server error.',
  })
  async findAllByCompany(@Query() query: GetLotDTO): Promise<LotResponseDTO[]> {
    return await this.lotService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single lot by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the lot to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The lot was retrieved successfully.',
    type: () => SwaggerResponseType(LotResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lot record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOne(@Param('id') id: number): Promise<LotResponseDTO> {
    return await this.lotService.findById(id);
  }
}
