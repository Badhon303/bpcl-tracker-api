import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @ApiProperty({
    description: 'Username or email address of the user',
    example: 'johndoe',
  })
  @IsNotEmpty()
  @IsString()
  usernameOrEmail: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'SecurePassword123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
