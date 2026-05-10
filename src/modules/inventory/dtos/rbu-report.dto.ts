import { ApiProperty } from '@nestjs/swagger';

export class RbuReportDTO {
  @ApiProperty({ description: 'Raw plastic weight', example: 1500.5 })
  rawPlasticWeight: number;

  @ApiProperty({
    description: 'Total number of supplier associated with procure plastic',
    example: 50,
  })
  totalSupplier: number;

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

  @ApiProperty({ description: 'Total number of shipment', example: 100 })
  totalShipments: number;

  @ApiProperty({
    description:
      'Number of unique drivers associated with the shipped shipments',
    example: 5,
  })
  totalDrivers: number;
}
