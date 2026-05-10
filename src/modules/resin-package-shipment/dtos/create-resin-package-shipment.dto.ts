import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateResinPackageShipmentDTO {
  @ApiProperty({
    description:
      'Type of resin package shipment (e.g., With transport, Without transport)',
    example: 'With transport',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  shipmentType: string;

  @ApiProperty({
    description: 'ID of the company owning the resin package shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID of the user creating the resin package shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Array of resin package IDs associated with the shipment',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  resinPackageIds: number[];
}
