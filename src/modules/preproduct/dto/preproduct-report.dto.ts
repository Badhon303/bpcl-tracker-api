import { ApiProperty } from '@nestjs/swagger';

export class PreproductReportDTO {
  @ApiProperty({ description: 'Preproduct weight', example: 1500.5 })
  preproductWeight: number;
}
