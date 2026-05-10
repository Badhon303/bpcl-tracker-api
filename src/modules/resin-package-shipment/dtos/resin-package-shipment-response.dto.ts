import { ApiProperty } from '@nestjs/swagger';
import { ShipmentResinPackageResponseDTO } from './shipment-resin-package-response.dto';

export class ResinPackageShipmentResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the resin package shipment',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Type of shipment (e.g., With transport, Without transport)',
    example: 'With transport',
    type: String,
  })
  shipmentType: string;

  @ApiProperty({
    description: 'Date and time when the resin package shipment was created',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'ID of the user who created the resin package shipment',
    example: 1,
    type: Number,
  })
  createdBy: number;

  @ApiProperty({
    description:
      'Date and time when the resin package shipment was last updated',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who last updated the resin package shipment',
    example: 1,
    type: Number,
  })
  updatedBy: number;

  @ApiProperty({
    description: 'ID of the company owning the resin package shipment',
    example: 1,
    type: Number,
  })
  companyId: number;

  @ApiProperty({
    description: 'ID of the user associated with the resin package shipment',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'List of resin packages associated with the shipment',
    type: [ShipmentResinPackageResponseDTO],
  })
  shipmentResinPackages: ShipmentResinPackageResponseDTO[];
}
