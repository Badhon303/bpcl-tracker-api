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
import { BacktrackQueryDTO } from './dto/backtrack-query.dto';
import { PreproductBacktrackResponseDTO } from './dto/preproduct-backtrack-response.dto';
import { ResinBacktrackResponseDTO } from './dto/resin-backtrack-response.dto';
import { BlockchainBacktrackService } from './blockchain-backtrack.service';

@ApiTags('Backend Backtrack')
@Controller('backend-backtrack')
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class BackendBacktrackController {
  constructor(private readonly backtrackService: BlockchainBacktrackService) {}

  @Get('preproduct/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Backtrack preproduct history from backend records',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the preproduct package to backtrack',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Preproduct backtrack data retrieved from backend records.',
    type: () => SwaggerResponseType(PreproductBacktrackResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Preproduct package not found for the specified company.',
  })
  async backtrackPreproduct(
    @Param('id') id: number,
    @Query() query: BacktrackQueryDTO,
  ): Promise<any> {
    return this.backtrackService.backtrackPreproductFromBackend(id, query);
  }

  @Get('resin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Backtrack resin history from backend records' })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
    description: 'ID of the resin package to backtrack',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Resin backtrack data retrieved from backend records.',
    type: () => SwaggerResponseType(ResinBacktrackResponseDTO),
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Resin package not found for the specified company.',
  })
  async backtrackResin(
    @Param('id') id: number,
    @Query() query: BacktrackQueryDTO,
  ): Promise<any> {
    return this.backtrackService.backtrackResinFromBackend(id, query);
  }
}
