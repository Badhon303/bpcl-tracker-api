import { ApiProperty } from '@nestjs/swagger';

export class ResinPackageReportDTO {
  @ApiProperty({ description: 'Resin package quantity', example: 1000 })
  resinPackageQuantity: number;
}
