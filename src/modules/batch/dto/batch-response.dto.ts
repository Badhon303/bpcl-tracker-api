import { ApiProperty } from '@nestjs/swagger';
import { BatchBaleResponseDTO } from './batch-bale-response.dto';
import { Status } from '../enum/status.enum';
import { IsEnum } from 'class-validator';

export class BatchResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the batch',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Unique display ID for the batch',
    example: '001',
    type: String,
  })
  batchDisplayId: string;

  @ApiProperty({
    description: 'Type of product (e.g., White bottle)',
    example: 'White Bottle',
    type: String,
  })
  productType: string;

  @ApiProperty({
    enum: Status,
    example: Status.Ongoing,
  })
  @IsEnum(Status)
  batchCreationStatus: Status;

  @ApiProperty({
    enum: Status,
    example: Status.Ongoing,
  })
  @IsEnum(Status)
  preproductCreationStatus: Status;

  @ApiProperty({
    description: 'Total number of bales added in batch',
    example: 5.0,
    default: 0,
  })
  totalBales: number;

  @ApiProperty({
    description: 'Net weight of bales added in batch',
    example: 400.0,
    default: 0,
  })
  weight: number;

  @ApiProperty({
    description: 'Date and time when the batch was created',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'ID of the user who created the batch',
    example: 1,
    type: Number,
  })
  createdBy: number;

  @ApiProperty({
    description: 'Date and time when the batch was last updated',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who last updated the batch',
    example: 1,
    type: Number,
  })
  updatedBy: number;

  @ApiProperty({
    description: 'ID of the company owning the batch',
    example: 1,
    type: Number,
  })
  companyId: number;

  @ApiProperty({
    description: 'ID of the user associated with the batch',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'List of bales associated with the batch',
    type: [BatchBaleResponseDTO],
  })
  batchBales: BatchBaleResponseDTO[];

  @ApiProperty({
    description:
      'Company-wise bale weight (company ID to total weight mapping)',
    example: { '1': 500.75, '2': 300 },
    type: Object,
  })
  companyBaleWeights: { [companyId: number]: number };
}
