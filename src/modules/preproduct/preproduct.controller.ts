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
import { CreatePreproductDTO } from './dto/create-preproduct.dto';
import { GetPreproductDTO } from './dto/get-preproduct.dto';
import { PreproductResponseDTO } from './dto/preproduct-response.dto';
import { PreproductService } from './preproduct.service';

@ApiTags('Preproduct')
@Controller('pre-products')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class PreproductController {
  constructor(private readonly preProductService: PreproductService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new pre-product' })
  @ApiCreatedResponse({
    description: 'The pre-product has been successfully created.',
    type: () => SwaggerResponseType(PreproductResponseDTO),
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
    description: 'Preproduct creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createPreproductDto: CreatePreproductDTO,
  ): Promise<PreproductResponseDTO> {
    return await this.preProductService.create(createPreproductDto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all pre-products for a company' })
  @ApiOkResponse({
    description: 'List of pre-products for the specified company.',
    type: () => SwaggerResponseType(PreproductResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve preproduct records due to a server error.',
  })
  async findAllByCompany(
    @Query() query: GetPreproductDTO,
  ): Promise<PreproductResponseDTO[]> {
    return await this.preProductService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pre-product details by ID' })
  @ApiParam({
    name: 'preproductId',
    required: true,
    type: Number,
    description: 'ID of the pre-product to fetch',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Details of the pre-product.',
    type: () => SwaggerResponseType(PreproductResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preproduct record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOneById(@Param('id') id: number): Promise<PreproductResponseDTO> {
    return await this.preProductService.findById(id);
  }
}
