import { ApiProperty } from '@nestjs/swagger';
import { CompanyResponseDTO } from 'src/modules/company/dto/company-response.dto';
import { RoleResponseDTO } from 'src/modules/role/dto/role-response.dto';

export class UserResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the user profile',
    example: '1',
  })
  id: number;

  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
    nullable: true,
  })
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
    nullable: true,
  })
  lastName?: string;

  @ApiProperty({
    description: 'Contact phone number of the user',
    example: '+1234567890',
    required: false,
    nullable: true,
  })
  contact?: string;

  @ApiProperty({
    description: 'Date of birth of the user in YYYY-MM-DD format',
    example: '1990-01-01',
    required: false,
    nullable: true,
  })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender of the user',
    example: 'Male',
    required: false,
    nullable: true,
  })
  gender?: string;

  @ApiProperty({
    description: 'Physical address of the user',
    example: '123 Main St, City, Country',
    required: false,
    nullable: true,
  })
  address?: string;

  @ApiProperty({
    description: 'URL or path to the user’s profile image',
    example: 'https://example.com/images/profile.jpg',
    required: false,
    nullable: true,
  })
  profileImg?: string;

  @ApiProperty({
    description: 'List of roles assigned to the user',
    type: () => [RoleResponseDTO],
  })
  roles: RoleResponseDTO[];

  @ApiProperty({
    description: 'Company associated with the user',
    type: () => CompanyResponseDTO,
  })
  company: CompanyResponseDTO;
}
