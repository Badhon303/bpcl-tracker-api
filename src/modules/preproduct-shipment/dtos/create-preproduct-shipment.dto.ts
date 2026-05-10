import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePreproductShipmentDTO {
  @ApiProperty({
    description:
      'Type of preproduct shipment (e.g., With transport, Without transport)',
    example: 'With transport',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  shipmentType: string;

  @ApiProperty({
    description: 'ID of the company owning the preproduct shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID of the user creating the preproduct shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description:
      'Array of preproduct package IDs associated with the preproduct shipment',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  preproductPackageIds: number[];
}
