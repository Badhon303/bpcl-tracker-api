import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber } from 'class-validator';

export class AssignBaleInShipmentDTO {
  @ApiProperty({ example: 1 })
  @IsInt()
  shipmentId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  baleId: number;

  @ApiProperty({
    example: 100.5,
  })
  @IsNumber()
  baleShipmentWeight: number;
}
