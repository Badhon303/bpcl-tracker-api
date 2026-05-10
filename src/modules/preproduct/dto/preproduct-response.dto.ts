import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { BatchResponseDTO } from 'src/modules/batch/dto/batch-response.dto';

export class PreproductResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the preproduct record',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Unique display ID for the batch preproduct',
    example: '001',
  })
  @IsString()
  preproductDisplayId: string;

  @ApiProperty({
    description: 'Batch ID for the procurement',
    example: '1',
  })
  @IsInt()
  batchId: number;

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
    example: 50,
  })
  @IsString()
  @IsNotEmpty()
  grade: string;

  @ApiProperty({
    description: 'Weight of the preproduct',
    example: 100.5,
  })
  preproductWeight: number;

  @ApiProperty({
    description: 'Weight of the wastage',
    example: 50.25,
  })
  wastageWeight: number;

  @ApiProperty({
    description: 'Company ID for the preproduct',
    example: '1',
  })
  @IsInt()
  companyId: number;

  @ApiProperty({
    description: 'User ID for the preproduct',
    example: '1',
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
    description: 'Company-wise bale weight',
    example: { '1': 500.75, '2': 300 },
    type: Object,
  })
  companyBaleWeights: { [companyId: number]: number };

  @ApiProperty({
    description: 'Batch associated with the preproduct',
    type: () => BatchResponseDTO,
  })
  @Exclude()
  batch: BatchResponseDTO;
}
