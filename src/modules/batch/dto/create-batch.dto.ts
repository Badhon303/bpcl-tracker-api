import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateBatchDTO {
  @ApiProperty({
    description: 'Type of product (e.g., White Bollte)',
    example: 'White Bollte',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  productType: string;

  @ApiProperty({
    description: 'ID of the company owning the batch',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID of the user creating the batch',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
