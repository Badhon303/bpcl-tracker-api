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

export class CreateBaleDTO {
  @ApiProperty({
    description: 'Type of packaging for the bale',
    example: 'Bale or Flakes',
  })
  @IsString()
  @IsNotEmpty()
  packagingType: string;

  @ApiProperty({
    description: 'Type of product in the bale',
    example: 'White Bottle',
  })
  @IsString()
  @IsNotEmpty()
  productType: string;

  @ApiProperty({
    description: 'Weight of the bale',
    example: 500.75,
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Latitude of the bale location',
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
    description: 'Longitude of the bale location',
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
    description: 'Company ID for the bale',
    example: '1',
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'User ID for the bale',
    example: '1',
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
