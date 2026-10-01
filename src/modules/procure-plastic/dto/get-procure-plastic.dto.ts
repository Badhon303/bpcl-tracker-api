import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class GetProcurePlasticDTO {
  @ApiProperty({
    description: 'Start date for filtering (optional)',
    example: '2025-07-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiProperty({
    description: 'End date for filtering (optional)',
    example: '2025-07-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiProperty({
    description: 'Company ID to filter bale records (optional)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  companyId?: number;

  @ApiProperty({
    description: 'Page number, starting at 1 (optional, used with limit)',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Page size (optional). When omitted all records are returned',
    example: 20,
    required: false,
  })
  @IsOptional()
  limit?: number;
}
