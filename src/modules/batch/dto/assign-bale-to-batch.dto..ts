import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignBaleToBatchDTO {
  @ApiProperty({ example: '1' })
  @IsInt()
  batchId: number;

  @ApiProperty({ example: '1' })
  @IsInt()
  baleId: number;
}
