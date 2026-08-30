import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
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
    description:
      'Custom weight(s) for the package(s) being created manually. ' +
      'Each entry in the array creates one package with that exact weight ' +
      '(e.g. entered by the user on the Android app).',
    example: [25, 30],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  packageWeights: number[];

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
