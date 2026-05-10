import { ApiProperty } from '@nestjs/swagger';

export class DriverReportDTO {
  @ApiProperty({
    description: 'Total number of driver of a compamy',
    example: 50,
  })
  totalDriver: number;
}
