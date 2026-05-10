import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class VehicleResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the transport record',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'BRTC number of the transport',
    example: 'BRTC-123456',
  })
  @IsString()
  brtcNumber: string;

  @ApiPropertyOptional({
    description: 'Chassis number of the transport',
    example: 'CHASSIS-789012',
  })
  @IsString()
  chassisNumber: string;

  @ApiProperty({
    description: 'ID of the associated company',
    example: 1,
  })
  @IsInt()
  companyId: number;
}
