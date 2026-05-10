import { ApiProperty } from '@nestjs/swagger';

export class BaleReportDTO {
  @ApiProperty({ description: 'Total bale quantity', example: 1000 })
  baleQuantity: number;

  @ApiProperty({ description: 'Total bale weight', example: 100000.0 })
  baleWeight: number;
}
