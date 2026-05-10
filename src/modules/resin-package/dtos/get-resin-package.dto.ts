import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class GetResinPackageDTO {
  @ApiProperty({
    description: 'Start date for filtering resin package records (optional)',
    example: '2025-07-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string = new Date().toISOString();

  @ApiProperty({
    description: 'End date for filtering resin package records (optional)',
    example: '2025-07-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  toDate?: string = new Date().toISOString();

  @ApiProperty({
    description: 'Company ID to filter resin package records (optional)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  companyId?: number;
}
