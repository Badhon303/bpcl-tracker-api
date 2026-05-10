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
import { CreateResinPackageDTO } from './dtos/create-resin-package.dto';
import { GetResinPackageDTO } from './dtos/get-resin-package.dto';
import { ResinPackageResponseDTO } from './dtos/resin-package-response.dto';
import { ResinPackageService } from './resin-package.service';

@ApiTags('ResinPackage')
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
@Controller('resin-package')
export class ResinPackageController {
  constructor(private readonly resinPackageService: ResinPackageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new resin package' })
  @ApiCreatedResponse({
    description: 'The preproresinduct package has been successfully created.',
    type: () => SwaggerResponseType(ResinPackageResponseDTO, true),
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
    description: 'Resin Package creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createResinPackageDto: CreateResinPackageDTO,
  ): Promise<ResinPackageResponseDTO[]> {
    return await this.resinPackageService.create(createResinPackageDto);
  }

  @Get('get-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all resin packages for a company' })
  @ApiOkResponse({
    description: 'List of preproduct packages for the specified company.',
    type: () => SwaggerResponseType(ResinPackageResponseDTO, true),
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
    @Query() query: GetResinPackageDTO,
  ): Promise<ResinPackageResponseDTO[]> {
    return await this.resinPackageService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single resin package by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the resin package to retrieve',
    example: 1,
  })
  @ApiOkResponse({
    description: 'The resin package was retrieved successfully.',
    type: () => SwaggerResponseType(ResinPackageResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resin Package record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOne(@Param('id') id: number): Promise<ResinPackageResponseDTO> {
    return await this.resinPackageService.findById(id);
  }
}
