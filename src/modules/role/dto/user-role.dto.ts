import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateUserRoleDTO {
  @ApiProperty({
    description: 'ID of the user profile',
    example: 1,
  })
  @IsInt()
  userid: number;

  @ApiProperty({
    description: 'ID of the role',
    example: 1,
  })
  @IsInt()
  roleid: number;
}
