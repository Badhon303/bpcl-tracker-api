import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDTO } from 'src/modules/auth/dto/user-response.dto';

export class AuthResponseDTO {
  @ApiProperty({
    description: 'User profile details',
    type: () => UserResponseDTO,
  })
  profile: UserResponseDTO;
}
