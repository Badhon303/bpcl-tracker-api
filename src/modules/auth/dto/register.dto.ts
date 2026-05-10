import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class RegisterDTO {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'SecurePassword123!',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Contact phone number of the user',
    example: '+1234567890',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiProperty({
    description: 'Date of birth of the user in YYYY-MM-DD format',
    example: '1990-01-01',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender of the user',
    example: 'Male',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({
    description: 'Physical address of the user',
    example: '123 Main St, City, Country',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'URL or path to the user’s profile image',
    example: 'https://example.com/images/profile.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  profileImg?: string;

  @ApiProperty({
    description: 'ID of the role assigned to the user',
    example: '1',
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  roleId: number;

  @ApiProperty({
    description: 'ID of the company associated with the user',
    example: '1',
    required: true,
  })
  @IsNotEmpty()
  @IsInt()
  companyId: number;
}
