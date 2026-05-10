import {
  Controller,
  Get,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BpclRequestLogInterceptor,
  SwaggerResponseType,
  TransformInterceptor,
} from 'bpcl/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BpclReportDTO } from './dtos/bpcl-report.dto';
import { GetReportDTO } from './dtos/get-report.dto';
import { InventorySummaryReportDTO } from './dtos/inventory-summary.dto';
import { RbuReportDTO } from './dtos/rbu-report.dto';
import { InventoryService } from './inventory.service';
@ApiTags('Inventory')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('rbu')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get RBU report' })
  @ApiOkResponse({
    description: 'Retrieve RBU report, optionally filtered by date range',
    type: () => SwaggerResponseType(RbuReportDTO),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve RBU report due to a server error.',
  })
  async getRbuReport(@Query() query: GetReportDTO): Promise<RbuReportDTO> {
    return this.inventoryService.getRbuReport(query);
  }

  @Get('bpcl')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get BPCL report' })
  @ApiOkResponse({
    description: 'Retrieve BPCL report, optionally filtered by date range',
    type: () => SwaggerResponseType(BpclReportDTO),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve BPCL report due to a server error.',
  })
  async getBpclReport(@Query() query: GetReportDTO): Promise<BpclReportDTO> {
    return this.inventoryService.getBpclReport(query);
  }

  @Get('summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get inventory summary' })
  @ApiOkResponse({
    description:
      'Retrieve inventory summary report, optionally filtered by date range',
    type: () => SwaggerResponseType(InventorySummaryReportDTO),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'Failed to retrieve inventory summary report due to a server error.',
  })
  async getInventoryReport(
    @Query('companyId', ParseIntPipe) companyId: number,
  ): Promise<InventorySummaryReportDTO> {
    return this.inventoryService.getInventorySummaryReport(companyId);
  }
}
