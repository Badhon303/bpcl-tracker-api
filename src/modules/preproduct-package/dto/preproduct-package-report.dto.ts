import { ApiProperty } from '@nestjs/swagger';

export class PreproductPackageReportDTO {
  @ApiProperty({ description: 'Preproduct package quantity', example: 100 })
  preproductPackageQuantity: number;

  @ApiProperty({
    description: 'Shipped Preproduct package quantity',
    example: 50,
  })
  shippedPreproductPackageQuantity: number;
}
