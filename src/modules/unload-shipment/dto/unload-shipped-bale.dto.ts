import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber } from 'class-validator';

export class UnloadShippedBaleDTO {
  @ApiProperty({ example: 1 })
  @IsInt()
  unloadShipmentId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  baleId: number;
}
