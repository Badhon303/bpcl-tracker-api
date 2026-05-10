import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LotResponseDTO } from 'src/modules/lot/dtos/lot-response.dto';

export class ResinDhopeResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the resin dhope',
    example: 1,
    type: Number,
  })
  id: number;

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
  })
  @IsNotEmpty()
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

  @ApiProperty({
    description: 'Company-wise bale weight',
    example: { '1': 500.75, '2': 300 },
    type: Object,
  })
  companyBaleWeights: { [companyId: number]: number };

  @ApiProperty({
    description: 'Lot associated with the resin dhope',
    type: LotResponseDTO,
  })
  lot: LotResponseDTO;
}
