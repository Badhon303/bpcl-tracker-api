import { ApiProperty } from '@nestjs/swagger';
import { LotPreproductResponseDTO } from './lot-preproduct-response.dto';
import { IsEnum } from 'class-validator';
import { Status } from '../enum/status.enum';
export class LotResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the lot',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Type of product (e.g., White bottle)',
    example: 'White Bottle',
    type: String,
  })
  productType: string;

  @ApiProperty({
    description: 'Weight of the lot',
    example: 100.5,
  })
  weight: number;

  @ApiProperty({
    enum: Status,
    example: Status.Ongoing,
  })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({
    description: 'Date and time when the lot was created',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'ID of the user who created the lot',
    example: 1,
    type: Number,
  })
  createdBy: number;

  @ApiProperty({
    description: 'Date and time when the lot was last updated',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who last updated the lot',
    example: 1,
    type: Number,
  })
  updatedBy: number;

  @ApiProperty({
    description: 'ID of the company owning the lot',
    example: 1,
    type: Number,
  })
  companyId: number;

  @ApiProperty({
    description: 'ID of the user associated with the lot',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'Company-wise bale weight',
    example: { '1': 500.75, '2': 300 },
    type: Object,
  })
  companyBaleWeights: { [companyId: number]: number };

  @ApiProperty({
    description: 'List of preproducts associated with the lot',
    type: [LotPreproductResponseDTO],
  })
  lotPreproducts: LotPreproductResponseDTO[];
}
