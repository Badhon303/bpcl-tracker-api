import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class GetBatchDTO {
  @ApiProperty({
    description: 'Start date for filtering batch records (optional)',
    example: '2025-07-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiProperty({
    description: 'End date for filtering batch records (optional)',
    example: '2025-07-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiProperty({
    description: 'Company ID to filter batch records (optional)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  companyId?: number;

  @ApiProperty({
    description: 'status to filter',
    example: 'Ongoing',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  limit?: number;
}
