import { ApiProperty } from '@nestjs/swagger';

export class ResinDhopeReportDTO {
  @ApiProperty({ description: 'Resin dhope weight', example: 1500.5 })
  resinDhopeWeight: number;
}
