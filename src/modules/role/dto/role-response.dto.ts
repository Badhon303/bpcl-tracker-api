import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString } from 'class-validator';
import { FeatureResponseDTO } from 'src/modules/feature/dto/feature-response.dto';

export class RoleResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the role',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Name of the role',
    example: 'Admin',
  })
  @IsString()
  rolename: string;

  @ApiProperty({
    description: 'Description of the role',
    example: 'Administrator role with full access',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Array of features associated with the role',
    type: () => [FeatureResponseDTO],
  })
  @IsArray()
  @Type(() => FeatureResponseDTO)
  features: FeatureResponseDTO[];
}
