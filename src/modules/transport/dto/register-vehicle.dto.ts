import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterVehicleDTO {
  @ApiProperty({
    description: 'BRTC number of the vehicle',
    example: 'BRTC-123456',
  })
  @IsString()
  @IsNotEmpty()
  brtcNumber: string;

  @ApiPropertyOptional({
    description: 'Chassis number of the vehicle',
    example: 'CHASSIS-789012',
  })
  @IsString()
  @IsOptional()
  chassisNumber: string;

  @ApiProperty({
    description: 'ID of the associated company',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;

  @ApiProperty({
    description: 'ID of the associated user profile',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;
}
