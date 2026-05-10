import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDTO {
  @ApiProperty({
    description: 'Unique name of the role',
    example: 'ADMIN',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the role',
    example: 'Administrator role with full access',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
