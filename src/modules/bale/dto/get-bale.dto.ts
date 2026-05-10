import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class GetBaleDTO {
  @ApiProperty({
    description: 'Start date for filtering bale records (optional)',
    example: '2025-07-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiProperty({
    description: 'End date for filtering bale records (optional)',
    example: '2025-07-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiProperty({
    description: 'Company ID to filter bale records (optional)',
    example: '1',
    required: false,
  })
  @IsInt()
  @IsOptional()
  companyId?: number;

  @ApiProperty({
    description:
      'Type of bale (optional: e.g. All, White, Green, Brown bottle etc.)',
    example: 'White Bottle',
    required: false,
  })
  @IsOptional()
  productType?: string;
}
