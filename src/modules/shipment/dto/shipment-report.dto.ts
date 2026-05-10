import { ApiProperty } from '@nestjs/swagger';

export class ShipmentReportDTO {
  @ApiProperty({ description: 'Total number of shipment', example: 100 })
  totalBaleShipments: number;

  @ApiProperty({ description: 'Total shipped bale weight', example: 1000.0 })
  totalShippedBaleWeight: number;
}
