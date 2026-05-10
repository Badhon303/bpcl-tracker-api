import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePreproductPackageDTO {
  @ApiProperty({
    description: 'ID of the preproduct from which the package is created.',
    example: 2,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  preproductId: number;

  @ApiProperty({
    description: 'Type of product (e.g., White Bollte)',
    example: 'White Bollte',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  productType: string;

  @ApiProperty({
    description: 'Package Weight',
    example: 25,
  })
  @IsNumber()
  @IsNotEmpty()
  packageWeight: number;

  @ApiProperty({
    description:
      'ID of the last preproduct which will be merged in another preproduct',
    example: 1,
    type: Number,
    required: false,
  })
  @IsInt()
  @IsOptional()
  remainingPreproductId: number;

  @ApiProperty({
    description: 'Remaining weight of the last preproduct',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  remainingWeight: number;

  @ApiProperty({
    description: 'ID of the company owning the package',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID of the user creating the package',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
