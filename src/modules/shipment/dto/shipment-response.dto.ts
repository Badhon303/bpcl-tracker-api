import { ApiProperty } from '@nestjs/swagger';
import { DriverResponseDTO } from 'src/modules/transport/dto/driver-response.dto';
import { VehicleResponseDTO } from 'src/modules/transport/dto/vehicle-response.dto';
import { ShipmentBaleResponseDTO } from './shipment-bale-response.dto';
import { Status } from '../enum/status.enum';
import { IsEnum } from 'class-validator';

export class ShipmentResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the shipment',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Unique display ID for the shipment',
    example: '001',
    type: String,
  })
  shipmentDisplayId: string;

  @ApiProperty({
    description: 'Name of the company sending the shipment',
    example: 'RBU',
    type: String,
  })
  fromCompany: string;

  @ApiProperty({
    description: 'Name of the company receiving the shipment',
    example: 'BPCL',
    type: String,
  })
  toCompany: string;

  @ApiProperty({
    description: 'Type of shipment (e.g., With transport, Without transport)',
    example: 'With transport',
    type: String,
  })
  shipmentType: string;

  @ApiProperty({
    enum: Status,
    example: Status.Processing,
  })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({
    description: 'ID of the vehicle used for the shipment (optional)',
    example: 1,
    type: Number,
    required: false,
    nullable: true,
  })
  vehicleId?: number;

  @ApiProperty({
    description: 'ID of the driver assigned to the shipment (optional)',
    example: 1,
    type: Number,
    required: false,
    nullable: true,
  })
  driverId?: number;

  @ApiProperty({
    description: 'Date and time when the shipment was created',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'ID of the user who created the shipment',
    example: 1,
    type: Number,
  })
  createdBy: number;

  @ApiProperty({
    description: 'Date and time when the shipment was last updated',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who last updated the shipment',
    example: 1,
    type: Number,
  })
  updatedBy: number;

  @ApiProperty({
    description: 'Total number of bales added in shipment',
    example: 5.0,
  })
  totalBales: number;

  @ApiProperty({
    description: 'Net weight of bales added in shipment',
    example: 400.0,
  })
  totalWeight: number;

  @ApiProperty({
    description: 'ID of the company owning the shipment',
    example: 1,
    type: Number,
  })
  companyId: number;

  @ApiProperty({
    description: 'ID of the user associated with the shipment',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'List of bales associated with the shipment',
    type: [ShipmentBaleResponseDTO],
    required: false,
  })
  shipmentBales: ShipmentBaleResponseDTO[];

  @ApiProperty({
    description: 'Vehicle associated with the shipment',
    type: VehicleResponseDTO,
  })
  vehicle: VehicleResponseDTO;

  @ApiProperty({
    description: 'Driver associated with the shipment',
    type: DriverResponseDTO,
  })
  driver: DriverResponseDTO;
}
