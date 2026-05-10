import { ApiProperty } from '@nestjs/swagger';

export class VehicleReportDTO {
  @ApiProperty({
    description: 'Total number of vehicle of a compamy',
    example: 50,
  })
  totalVehicle: number;
}
