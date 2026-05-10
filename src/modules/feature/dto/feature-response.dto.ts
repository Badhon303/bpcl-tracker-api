import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class FeatureResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the feature',
    example: '1',
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Name of the feature',
    example: 'Create Package',
  })
  @IsString()
  featurename: string;

  @ApiProperty({
    description: 'Description of the feature',
    example: 'Create Package',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Tag of the feature',
    example: 'Operation',
  })
  @IsString()
  tag: string;
}
