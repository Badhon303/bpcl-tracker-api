import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { DriverResponseDTO } from 'src/modules/transport/dto/driver-response.dto';
import { VehicleResponseDTO } from 'src/modules/transport/dto/vehicle-response.dto';
import { UnloadShipmentBaleResponseDTO } from './unload-shipment-bale-response.dto';
import { ShipmentResponseDTO } from 'src/modules/shipment/dto/shipment-response.dto';
import { UnloadStatus } from '../enum/status.enum';

export class UnloadShipmentResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the shipment',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the shipment',
    example: 1,
    type: Number,
  })
  shipmentId: number;

  @ApiProperty({
    description: 'Total number of bales added in batch',
    example: 5.0,
  })
  totalBales: number;

  @ApiProperty({
    description: 'Total weight of container and bails',
    example: 500,
  })
  @IsNumber()
  @IsNotEmpty()
  totalWeightBeforeUnload: number;

  @ApiProperty({
    description: 'Weight of the container',
    example: 300,
  })
  @IsNumber()
  @IsNotEmpty()
  totalWeightAfterUnload: number;

  @ApiProperty({
    description: 'Net weight of bales',
    example: 200,
  })
  @IsNumber()
  @IsNotEmpty()
  receivedShipmentWeight: number;

  @ApiProperty({
    description: 'Unloading note',
    example: 'Everything is ok',
    type: String,
  })
  unloadingNote: string;

  @ApiProperty({
    enum: UnloadStatus,
    example: UnloadStatus.Ongoing,
  })
  @IsEnum(UnloadStatus)
  status: UnloadStatus;

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
    type: [UnloadShipmentBaleResponseDTO],
  })
  unloadShipmentBales: UnloadShipmentBaleResponseDTO[];

  @ApiProperty({
    description: 'Shipment details',
    type: ShipmentResponseDTO,
  })
  shipment: ShipmentResponseDTO;
}
