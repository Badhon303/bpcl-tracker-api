import { ApiProperty } from '@nestjs/swagger';

export class ProcurePlasticReportDTO {
  @ApiProperty({ description: 'Raw plastic weight', example: 1500.5 })
  rawPlasticWeight: number;
}
