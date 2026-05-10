import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProcurePlasticDTO {
  @ApiProperty({
    description: 'Supplier ID for the procurement',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  supplierId: number;

  @ApiPropertyOptional({
    description: 'Chalan number for the procurement',
    example: 'CHL/2023/00158',
  })
  @IsString()
  @IsOptional()
  chalanNumber: string;

  @ApiPropertyOptional({
    description: 'Receipt number for the procurement',
    example: 'DN/BPC/KA/2024/00042',
  })
  @IsString()
  @IsOptional()
  receiptNumber: string;

  @ApiProperty({
    description: 'Quantity of mixed PET plastic',
    example: 100.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  mixedPetQuantity: number;

  @ApiProperty({
    description: 'Price of mixed PET plastic',
    example: 50.25,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  mixedPetPrice: number;

  @ApiProperty({
    description: 'Quantity of non-PET plastic',
    example: 200.75,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  nonPetQuantity: number;

  @ApiProperty({
    description: 'Price of non-PET plastic',
    example: 30.15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  nonPetPrice: number;

  @ApiProperty({
    description: 'Quantity of amber plastic',
    example: 150.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  amberQuantity: number;

  @ApiProperty({
    description: 'Price of amber plastic',
    example: 40.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  amberPrice: number;

  @ApiProperty({
    description: 'Payment method used',
    example: 'Bkash',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({
    description: 'Account number for payment',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  accountNo: string;

  @ApiProperty({
    description: 'Link to the procurement image',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  imageLink: string;

  @ApiPropertyOptional({
    description: 'Latitude of the procure plastic location',
    example: 23.8103,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiPropertyOptional({
    description: 'Longitude of the procure plastic location',
    example: 90.4125,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Company ID for the procurement',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'User ID for the procurement',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
