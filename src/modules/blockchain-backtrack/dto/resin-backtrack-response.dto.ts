import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResinHistoryEntryDTO {
  @ApiProperty({
    description: 'Transaction ID on blockchain',
    example: 'tx123456789',
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
    description: 'Action performed (created, updated, transferred)',
    example: 'created',
    type: String,
  })
  @Expose()
  action: string;

  @ApiProperty({
    description: 'User who performed the action',
    example: 'user123',
    type: String,
  })
  @Expose()
  performedBy: string;

  @ApiProperty({
    description: 'Additional data related to the transaction',
    example: { weight: 100, quality: 'A+' },
    type: Object,
  })
  @Expose()
  data: any;
}

export class ResinBacktrackResponseDTO {
  @ApiProperty({
    description: 'Resin ID',
    example: 1,
    type: Number,
  })
  @Expose()
  resinId: number;

  @ApiProperty({
    description: 'Current status of the resin',
    example: 'processed',
    type: String,
  })
  @Expose()
  currentStatus: string;

  @ApiProperty({
    description: 'Creation date of the resin',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'History of transactions for this resin',
    type: [ResinHistoryEntryDTO],
  })
  @Expose()
  history: ResinHistoryEntryDTO[];

  @ApiProperty({
    description: 'Total number of transactions',
    example: 5,
    type: Number,
  })
  @Expose()
  totalTransactions: number;
}
