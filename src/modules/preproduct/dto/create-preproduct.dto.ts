import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePreproductDTO {
  @ApiProperty({
    description: 'Batch ID for the preproduct',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  batchId: number;

  @ApiProperty({
    description: 'Weight of the preproduct',
    example: 100.5,
  })
  @IsNumber()
  @IsNotEmpty()
  preproductWeight: number;

  @ApiProperty({
    description: 'Weight of the wastage',
    example: 50.25,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  wastageWeight: number;

  @ApiProperty({
    description: 'Type of product (e.g., White Bollte)',
    example: 'White Bollte',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  productType: string;

  @ApiProperty({
    description: 'Grade of the preproduct',
    example: '50',
  })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({
    description: 'Company ID for the procurement',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'Company ID for the procurement',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
