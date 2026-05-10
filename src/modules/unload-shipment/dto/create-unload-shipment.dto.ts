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

export class CreateUnloadShipmentDTO {
  @ApiProperty({
    description: 'ID of the shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsOptional()
  shipmentId: number;

  @ApiProperty({
    description: 'Total weight of container and bails',
    example: 500.75,
  })
  @IsNumber()
  @IsNotEmpty()
  totalWeightBeforeUnload: number;

  @ApiProperty({
    description: 'ID of the company owning the shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsOptional()
  companyId: number;

  @ApiProperty({
    description: 'ID of the user creating the shipment',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsOptional()
  userId: number;
}
