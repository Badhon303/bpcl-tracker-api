import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLotDTO {
  @ApiProperty({
    description: 'Type of product (e.g., White Bollte)',
    example: 'White Bollte',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  productType: string;

  @ApiProperty({
    description: 'ID of the company owning the lot',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID of the user creating the lot',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'Array of preproduct IDs associated with the lot',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  preproductIds: number[];
}
