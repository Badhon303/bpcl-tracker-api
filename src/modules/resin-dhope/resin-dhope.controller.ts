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
import { CreateResinDhopeDTO } from './dtos/create-resin-dhope.dto';
import { GetResinDhopeDTO } from './dtos/get-resin-dhope.dto';
import { ResinDhopeResponseDTO } from './dtos/resin-dhope-response.dto';
import { ResinDhopeService } from './resin-dhope.service';

@ApiTags('ResinDhope')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
@Controller('resin-dhope')
export class ResinDhopeController {
  constructor(private readonly resinDhopeService: ResinDhopeService) {}

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new resin dhope' })
  @ApiCreatedResponse({
    description: 'The resin dhope has been successfully created.',
    type: () => SwaggerResponseType(ResinDhopeResponseDTO),
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
    description: 'Resin dhope creation failed due to a server error.',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(
    @Body() createResinDhopeDto: CreateResinDhopeDTO,
  ): Promise<ResinDhopeResponseDTO> {
    return await this.resinDhopeService.create(createResinDhopeDto);
  }

  @Get('get-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all resin dhopes for a company' })
  @ApiOkResponse({
    description: 'List of resin dhopes for the specified company.',
    type: () => SwaggerResponseType(ResinDhopeResponseDTO, true),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description:
      'Failed to retrieve resin dhopes records due to a server error.',
  })
  async findAllByCompany(
    @Query() query: GetResinDhopeDTO,
  ): Promise<ResinDhopeResponseDTO[]> {
    return await this.resinDhopeService.findAllByCompany(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resin dhope details by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the resin dhope to fetch',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Details of the resin dhope.',
    type: () => SwaggerResponseType(ResinDhopeResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resin dhope record not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access. Valid JWT token required.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Server error while retrieving the record.',
  })
  async findOneById(@Param('id') id: number): Promise<ResinDhopeResponseDTO> {
    return await this.resinDhopeService.findById(id);
  }
}
