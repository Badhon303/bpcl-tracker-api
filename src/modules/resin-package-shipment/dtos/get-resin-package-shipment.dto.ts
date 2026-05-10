import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class GetResinPackageShipmentDTO {
  @ApiProperty({
    description:
      'Start date for filtering resin package Shipment records (optional)',
    example: '2025-07-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiProperty({
    description:
      'End date for filtering resin package Shipment records (optional)',
    example: '2025-07-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiProperty({
    description:
      'Company ID to filter resin package Shipment records (optional)',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsOptional()
  companyId?: number;
}
