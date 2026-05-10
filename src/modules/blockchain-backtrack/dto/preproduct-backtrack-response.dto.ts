import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PreproductHistoryEntryDTO {
  @ApiProperty({
    description: 'Transaction ID on blockchain',
    example: 'tx987654321',
    type: String,
  })
  @Expose()
  transactionId: string;

  @ApiProperty({
    description: 'Timestamp of the transaction',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  @Expose()
  timestamp: Date;

  @ApiProperty({
    description: 'Action performed (created, packaged, shipped)',
    example: 'packaged',
    type: String,
  })
  @Expose()
  action: string;

  @ApiProperty({
    description: 'User who performed the action',
    example: 'user456',
    type: String,
  })
  @Expose()
  performedBy: string;

  @ApiProperty({
    description: 'Additional data related to the transaction',
    example: { packageWeight: 50, batchId: 123 },
    type: Object,
  })
  @Expose()
  data: any;
}

export class PreproductBacktrackResponseDTO {
  @ApiProperty({
    description: 'Preproduct ID',
    example: 1,
    type: Number,
  })
  @Expose()
  preproductId: number;

  @ApiProperty({
    description: 'Current status of the preproduct',
    example: 'shipped',
    type: String,
  })
  @Expose()
  currentStatus: string;

  @ApiProperty({
    description: 'Creation date of the preproduct',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Associated batch information',
    example: { batchId: 123, batchNumber: 'BATCH-001' },
    type: Object,
  })
  @Expose()
  batchInfo: any;

  @ApiProperty({
    description: 'History of transactions for this preproduct',
    type: [PreproductHistoryEntryDTO],
  })
  @Expose()
  history: PreproductHistoryEntryDTO[];

  @ApiProperty({
    description: 'Total number of transactions',
    example: 7,
    type: Number,
  })
  @Expose()
  totalTransactions: number;
}
