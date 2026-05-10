import { ApiProperty } from '@nestjs/swagger';
import { ShipmentPreproductPackageResponseDTO } from './shipment-preproduct-package-response.dto';

export class PreproductShipmentResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the preproduct shipment',
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
    description: 'Date and time when the preproduct shipment was created',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'ID of the user who created the preproduct shipment',
    example: 1,
    type: Number,
  })
  createdBy: number;

  @ApiProperty({
    description: 'Date and time when the preproduct shipment was last updated',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who last updated the preproduct shipment',
    example: 1,
    type: Number,
  })
  updatedBy: number;

  @ApiProperty({
    description: 'ID of the company owning the preproduct shipment',
    example: 1,
    type: Number,
  })
  companyId: number;

  @ApiProperty({
    description: 'ID of the user associated with the preproduct shipment',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description:
      'List of preproduct packages associated with the preproduct shipment',
    type: [ShipmentPreproductPackageResponseDTO],
  })
  shipmentPreproductPackages: ShipmentPreproductPackageResponseDTO[];
}
