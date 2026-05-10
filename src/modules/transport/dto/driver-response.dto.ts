import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class DriverResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the transport record',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Name of the driver',
    example: 'John Doe',
  })
  @IsString()
  driverName: string;

  @ApiPropertyOptional({
    description: 'Address of the driver',
    example: '456 Driver St, City',
  })
  @IsString()
  driverAddress: string;

  @ApiProperty({
    description: 'Contact details of the driver',
    example: '+1234567890',
  })
  @IsString()
  driverContact: string;

  @ApiPropertyOptional({
    description: 'License details of the driver',
    example: 'RJ14CV000',
  })
  @IsString()
  driverLicense: string;

  @ApiPropertyOptional({
    description: 'Name of the helper',
    example: 'Jane Smith',
  })
  @IsString()
  helperName: string;

  @ApiPropertyOptional({
    description: 'Address of the helper',
    example: '789 Helper St, City',
  })
  @IsString()
  helperAddress: string;

  @ApiPropertyOptional({
    description: 'Contact details of the helper',
    example: '+0987654321',
  })
  @IsString()
  helperContact: string;

  @ApiProperty({
    description: 'CompanyId of the associated company',
    example: 1,
  })
  @IsInt()
  companyId: number;

  @ApiProperty({
    description: 'UserId of the associated company',
    example: 1,
  })
  @IsInt()
  userId: number;
}
