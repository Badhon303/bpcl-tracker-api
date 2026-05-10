import { ApiProperty } from '@nestjs/swagger';

export class BpclReportDTO {
  @ApiProperty({ description: 'Total bale quantity', example: 1000 })
  baleQuantity: number;

  @ApiProperty({ description: 'Total bale weight', example: 100000.0 })
  baleWeight: number;

  @ApiProperty({ description: 'Preproduct weight', example: 1500.5 })
  preproductWeight: number;

  @ApiProperty({ description: 'Preproduct package quantity', example: 100 })
  preproductPackageQuantity: number;

  @ApiProperty({
    description: 'Shipped Preproduct package quantity',
    example: 50,
  })
  shippedPreproductPackageQuantity: number;

  @ApiProperty({ description: 'Resin dhope weight', example: 1500.5 })
  resinDhopeWeight: number;

  @ApiProperty({ description: 'Percentage of preproduct', example: 35 })
  preproductPercentage: number;

  @ApiProperty({ description: 'Percentage of reson dhope', example: 25 })
  resinPercentage: number;

  @ApiProperty({ description: 'Percentage of bale', example: 40 })
  balePercentage: number;

  @ApiProperty({ description: 'Resin package quantity', example: 1000 })
  resinPackageQuantity: number;
}
