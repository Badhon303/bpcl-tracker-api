import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl } from 'class-validator';

export class CompanyResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the company',
    example: 1,
  })
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Name of the company',
    example: 'Test Company',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address of the company',
    example: 'contact@testcompany.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Phone number of the company',
    example: '+1234567890',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Website URL of the company',
    example: 'https://testcompany.com',
  })
  @IsUrl()
  website: string;

  @ApiProperty({
    description: 'URL to the company logo',
    example: 'https://testcompany.com/logo.png',
  })
  @IsUrl()
  logo: string;

  @ApiProperty({
    description: 'Type of the company',
    example: 'RBU',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Channel name of the company',
    example: 'Channel3',
  })
  @IsString()
  channelName: string;

  @ApiProperty({
    description: 'Chain code name of the company',
    example: 'BOCLChainCode',
  })
  @IsString()
  chaincodeName: string;

  @ApiProperty({
    description: 'Peer name of the company',
    example: 'Org1',
  })
  @IsString()
  peerName: string;
}
