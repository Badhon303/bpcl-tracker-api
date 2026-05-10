import {
  Controller,
  Get,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  BpclRequestLogInterceptor,
  SwaggerResponseType,
  TransformInterceptor,
} from 'bpcl/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyService } from './company.service';
import { CompanyResponseDTO } from './dto/company-response.dto';

@Controller('company')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all company' })
  @ApiOkResponse({
    description: 'Retrieve company records',
    type: () => SwaggerResponseType(CompanyResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve company records due to a server error.',
  })
  async findAll() {
    return this.companyService.findAll();
  }
}
