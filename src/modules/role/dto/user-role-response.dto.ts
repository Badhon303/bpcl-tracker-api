import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { UserResponseDTO } from 'src/modules/auth/dto/user-response.dto';

export class UserRoleResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the user role',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'ID of the associated user profile',
    example: 1,
  })
  @IsInt()
  userid: number;

  @ApiProperty({
    description: 'ID of the associated role',
    example: 1,
  })
  @IsInt()
  roleid: number;

  @ApiProperty({
    description: 'User profile associated with the user role',
    type: () => UserResponseDTO,
  })
  user: UserResponseDTO;
}
