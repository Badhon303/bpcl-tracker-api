import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateShipmentDTO {
  @ApiProperty({
    description: 'Name of the company sending the shipment',
    example: 'RBU',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  fromCompany: string;

  @ApiProperty({
    description: 'Name of the company receiving the shipment',
    example: 'BPCL',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  toCompany: string;

  @ApiProperty({
    description: 'Type of shipment (e.g., With transport, Without transport)',
    example: 'With transport',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  shipmentType: string;

  @ApiProperty({
    description: 'ID of the vehicle used for the shipment (optional)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsInt()
  @IsOptional()
  vehicleId?: number;

  @ApiProperty({
    description: 'ID of the driver assigned to the shipment (optional)',
    example: 1,
    type: Number,
    required: false,
  })
  @IsInt()
  @IsOptional()
  driverId?: number;

  @ApiProperty({
    description: 'ID of the company owning the shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID of the user creating the shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
