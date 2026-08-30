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

export class CreateResinPackageDTO {
  @ApiProperty({
    description:
      'ID of the resin dhope from which the resin package is created.',
    example: 2,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  resinDhopeId: number;

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
    description:
      'Custom weight(s) for the resin package(s) being created manually. ' +
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
      'ID of the last resin dhope which will be merged in another resin dhope',
    example: 1,
    type: Number,
    required: false,
  })
  @IsInt()
  @IsOptional()
  remainingResinDhopeId: number;

  @ApiProperty({
    description: 'Remaining weight of the last resin dhope',
    example: 10,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  remainingWeight: number;

  @ApiProperty({
    description: 'ID of the company owning the resin dhope',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID of the user creating the resin dhope',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
