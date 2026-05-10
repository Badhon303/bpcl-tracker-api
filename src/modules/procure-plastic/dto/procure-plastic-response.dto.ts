import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsString,
  IsUrl,
} from 'class-validator';
import { SupplierResponseDTO } from '../../supplier/dto/supplier-response.dto';

export class ProcurePlasticResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the procurement record',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Supplier ID for the procurement',
    example: 1,
  })
  @IsInt()
  supplierId: number;

  @ApiPropertyOptional({
    description: 'Chalan number for the procurement',
    example: 'CHL/2023/00158',
  })
  @IsString()
  chalanNumber: string;

  @ApiPropertyOptional({
    description: 'Receipt number for the procurement',
    example: 'DN/BPC/KA/2024/00042',
  })
  @IsString()
  receiptNumber: string;

  @ApiPropertyOptional({
    description: 'Quantity of mixed PET plastic',
    example: 100.5,
  })
  @IsNumber()
  mixedPetQuantity: number;

  @ApiPropertyOptional({
    description: 'Price of mixed PET plastic',
    example: 50.25,
  })
  @IsNumber()
  mixedPetPrice: number;

  @ApiPropertyOptional({
    description: 'Quantity of non-PET plastic',
    example: 200.75,
  })
  @IsNumber()
  nonPetQuantity: number;

  @ApiPropertyOptional({
    description: 'Price of non-PET plastic',
    example: 30.15,
  })
  @IsNumber()
  nonPetPrice: number;

  @ApiPropertyOptional({
    description: 'Quantity of amber plastic',
    example: 150.0,
  })
  @IsNumber()
  amberQuantity: number;

  @ApiPropertyOptional({
    description: 'Price of amber plastic',
    example: 40.0,
  })
  @IsNumber()
  amberPrice: number;

  @ApiProperty({
    description: 'Payment method used',
    example: 'Bank Transfer',
  })
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: 'Account number for payment',
    example: '1234567890',
  })
  @IsString()
  accountNo: string;

  @ApiProperty({
    description: 'Link to the procurement image',
    example: 'https://example.com/image.jpg',
  })
  @IsUrl()
  imageLink: string;

  @ApiPropertyOptional({
    description: 'Latitude of the procure plastic location',
    example: 23.8103,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  latitude: number;

  @ApiPropertyOptional({
    description: 'Longitude of the procure plastic location',
    example: 90.4125,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Company ID for the procurement',
    example: 1,
  })
  @IsInt()
  companyId: number;

  @ApiProperty({
    description: 'User ID for the procurement',
    example: 1,
  })
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'Date and time when the record was created',
    example: '2025-07-17T10:00:00Z',
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: 'ID of the user who created the record',
    example: 1,
  })
  @IsInt()
  createdBy: number;

  @ApiProperty({
    description: 'Date and time when the record was last updated',
    example: '2025-07-17T12:00:00Z',
  })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({
    description: 'ID of the user who last updated the record',
    example: 1,
  })
  @IsInt()
  updatedBy: number;

  @ApiProperty({
    description: 'Supplier associated with the procurement',
    type: () => SupplierResponseDTO,
  })
  supplier: SupplierResponseDTO;
}
