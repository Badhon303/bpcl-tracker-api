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
import { CreatePreproductPackageDTO } from './dto/create-preproduct-package.dto';
import { GetPreproductPackageDTO } from './dto/get-preproduct-package.dto';
import { PreproductPackageResponseDTO } from './dto/preproduct-package-response.dto';
import { PreproductPackageService } from './preproduct-package.service';

@ApiTags('PreproductPackage')
@Controller('preproduct-packages')
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class PreproductPackageController {
  constructor(
    private readonly preproductPackageService: PreproductPackageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new preproduct package' })
  @ApiCreatedResponse({
    description: 'The preproduct package has been successfully created.',
    type: () => SwaggerResponseType(PreproductPackageResponseDTO, true),
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
    description: 'Preproduct Package creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createPreproductPackageDto: CreatePreproductPackageDTO,
  ): Promise<PreproductPackageResponseDTO[]> {
    return await this.preproductPackageService.create(
      createPreproductPackageDto,
    );
  }

  @Get('get-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all preproduct packages for a company' })
  @ApiOkResponse({
    description: 'List of preproduct packages for the specified company.',
    type: () => SwaggerResponseType(PreproductPackageResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'Failed to retrieve preproduct package records due to a server error.',
  })
  async findAllByCompany(
    @Query() query: GetPreproductPackageDTO,
  ): Promise<PreproductPackageResponseDTO[]> {
    return await this.preproductPackageService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single preproduct package by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the preproduct package to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The preproduct package was retrieved successfully.',
    type: () => SwaggerResponseType(PreproductPackageResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preproduct Package record not found',
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
  ): Promise<PreproductPackageResponseDTO> {
    return await this.preproductPackageService.findById(id);
  }
}
