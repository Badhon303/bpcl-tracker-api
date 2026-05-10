import { ApiProperty } from '@nestjs/swagger';

export class SupplierReportDTO {
  @ApiProperty({
    description: 'Total number of supplier of a compamy',
    example: 50,
  })
  totalSupplier: number;
}
