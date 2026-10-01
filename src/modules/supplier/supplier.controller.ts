import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { SupplierDTO } from './dto/register-supplier.dto';
import { SupplierResponseDTO } from './dto/supplier-response.dto';
import { SupplierService } from './supplier.service';

@ApiTags('Supplier')
@Controller('supplier')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new supplier' })
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Creates a new supplier record with details.',
    type: () => SwaggerResponseType(SupplierResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input data, such as missing or incorrectly formatted fields in the request body.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. A valid JWT token is required in the Authorization header.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The specified company was not found in the database.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create the supplier record due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createSupplierDto: SupplierDTO,
  ): Promise<SupplierResponseDTO> {
    return this.supplierService.create(createSupplierDto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all suppliers for a company' })
  @ApiOkResponse({
    description: 'Retrieves a list of all supplier records.',
    type: () => SwaggerResponseType(SupplierResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. A valid JWT token is required in the Authorization header.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve supplier records due to a server error.',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'Filter suppliers by company ID',
    type: String,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('companyId') companyId?: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<SupplierResponseDTO[]> {
    return this.supplierService.findAll(companyId, Number(page), Number(limit));
  }
}
