import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
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
import { BlockchainBacktrackService } from './blockchain-backtrack.service';
import { BacktrackQueryDTO } from './dto/backtrack-query.dto';
import { PreproductBacktrackResponseDTO } from './dto/preproduct-backtrack-response.dto';
import { ResinBacktrackResponseDTO } from './dto/resin-backtrack-response.dto';

@ApiTags('Blockchain Backtrack')
@Controller('blockchain-backtrack')
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class BlockchainBacktrackController {
  constructor(
    private readonly blockchainBacktrackService: BlockchainBacktrackService,
  ) {}

  @Get('resin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Backtrack resin history on blockchain' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the resin to backtrack',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Resin backtrack data retrieved successfully.',
    type: () => SwaggerResponseType(ResinBacktrackResponseDTO),
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
    description: 'Resin not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Resin backtrack failed due to a server error.',
  })
  async backtrackResin(
    @Param('id') id: number,
    @Query() query: BacktrackQueryDTO,
  ): Promise<ResinBacktrackResponseDTO> {
    return await this.blockchainBacktrackService.backtrackResin(id, query);
  }

  @Get('preproduct/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Backtrack preproduct history on blockchain' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the preproduct to backtrack',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Preproduct backtrack data retrieved successfully.',
    type: () => SwaggerResponseType(PreproductBacktrackResponseDTO),
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
    description: 'Preproduct not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Preproduct backtrack failed due to a server error.',
  })
  async backtrackPreproduct(
    @Param('id') id: number,
    @Query() query: BacktrackQueryDTO,
  ): Promise<PreproductBacktrackResponseDTO> {
    return await this.blockchainBacktrackService.backtrackPreproduct(id, query);
  }
}
