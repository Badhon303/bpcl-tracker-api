import { ApiProperty } from '@nestjs/swagger';

export class BaleReportDTO {
  @ApiProperty({ description: 'Total bale quantity', example: 1000 })
  baleQuantity: number;

  @ApiProperty({ description: 'Total bale weight', example: 100000.0 })
  baleWeight: number;

  @ApiProperty({ description: 'Percentage of white bottle', example: 40 })
  whitePercentage: number;

  @ApiProperty({ description: 'Percentage of green bottle', example: 25 })
  greenPercentage: number;

  @ApiProperty({ description: 'Percentage of brown bottle', example: 35 })
  brownPercentage: number;
}
