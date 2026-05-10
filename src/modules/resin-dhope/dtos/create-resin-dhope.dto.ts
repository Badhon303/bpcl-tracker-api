import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateResinDhopeDTO {
  @ApiProperty({
    description: 'ID of the lot',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  lotId: number;

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
    description: 'Name of the machine used to create resin dhope',
    example: 'A',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  machine: string;

  @ApiProperty({
    description: 'Grade of the product',
    example: '50',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  grade: string;

  @ApiProperty({
    description: 'Weight of the resin dhope',
    example: 150,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  resinDhopeWeight: number;

  @ApiProperty({
    description: 'Wastage weight of the resin dhope',
    example: 150,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  wastageWeight: number;

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
