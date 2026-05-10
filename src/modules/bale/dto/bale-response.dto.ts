import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
} from 'class-validator';
import { BaleStatus } from '../enum/status.enum';

export class BaleResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the bale record',
    example: 1,
  })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    description:
      'Unique identifier for the bale, auto-incremented as a three-digit string',
    example: '001',
  })
  @IsString()
  @Expose()
  baleDisplayId: string;

  @ApiProperty({
    description: 'Type of packaging for the bale',
    example: 'Bale or Flakes',
  })
  @IsString()
  @Expose()
  packagingType: string;

  @ApiProperty({
    description: 'Type of product in the bale',
    example: 'White bottle',
  })
  @IsString()
  @Expose()
  productType: string;

  @ApiProperty({
    enum: BaleStatus,
    example: BaleStatus.Created,
  })
  @IsEnum(BaleStatus)
  @Expose()
  status: BaleStatus;

  @ApiProperty({
    description: 'Quantity of the bale',
    example: 500.75,
  })
  @IsNumber()
  @Expose()
  quantity: number;

  @ApiProperty({
    description: 'Shipment weight of the bale',
    example: 500.75,
  })
  @IsNumber()
  @Expose()
  baleShipmentWeight: number;

  @ApiPropertyOptional({
    description: 'Latitude of the bale location',
    example: 23.8103,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Expose()
  latitude: number;

  @ApiPropertyOptional({
    description: 'Longitude of the bale location',
    example: 90.4125,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Expose()
  longitude: number;

  @ApiProperty({
    description: 'Date and time when the record was created',
    example: '2025-07-17T10:00:00Z',
  })
  @IsDateString()
  @Expose()
  createdAt: string;

  @ApiProperty({
    description: 'ID of the user who created the record',
    example: 1,
  })
  @IsInt()
  @Expose()
  createdBy: number;

  @ApiProperty({
    description: 'Date and time when the record was last updated',
    example: '2025-07-17T12:00:00Z',
  })
  @IsDateString()
  @Expose()
  updatedAt: string;

  @ApiProperty({
    description: 'ID of the user who last updated the record',
    example: 1,
  })
  @IsInt()
  @Expose()
  updatedBy: number;

  @ApiProperty({
    description: 'Company ID for the bale',
    example: 1,
  })
  @IsInt()
  @Expose()
  companyId: number;

  @ApiProperty({
    description: 'User ID for the bale',
    example: 1,
  })
  @IsInt()
  @Expose()
  userId: number;

  @ApiProperty({
    description: 'Comapny associated with the bale',
    example: 'BPCL',
    required: false,
  })
  @Expose()
  companyName: string;
}
