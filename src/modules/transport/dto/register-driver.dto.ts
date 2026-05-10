import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDriverDTO {
  @ApiProperty({
    description: 'Name of the driver',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  driverName: string;

  @ApiPropertyOptional({
    description: 'Address of the driver',
    example: '456 Driver St, City',
  })
  @IsString()
  @IsOptional()
  driverAddress: string;

  @ApiProperty({
    description: 'Contact number of the driver',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  driverContact: string;

  @ApiPropertyOptional({
    description: 'Driver license number',
    example: 'L1',
  })
  @IsString()
  @IsOptional()
  driverLicense: string;

  @ApiPropertyOptional({
    description: 'Name of the helper',
    example: 'Jane Smith',
  })
  @IsString()
  @IsOptional()
  helperName: string;

  @ApiPropertyOptional({
    description: 'Address of the helper',
    example: '789 Helper St, City',
  })
  @IsString()
  @IsOptional()
  helperAddress: string;

  @ApiPropertyOptional({
    description: 'Contact number of the helper',
    example: '+0987654321',
  })
  @IsString()
  @IsOptional()
  helperContact: string;

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
