import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { UserResponseDTO } from 'src/modules/auth/dto/user-response.dto';

export class LoginResponseDTO {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  access_token: string;

  @ApiProperty({
    description: 'User profile details',
    type: () => UserResponseDTO,
  })
  profile: UserResponseDTO;
}
