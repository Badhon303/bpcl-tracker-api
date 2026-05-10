import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class SupplierDTO {
  @ApiProperty({
    description: 'Category of the supplier',
    example: 'Plastic Recycling',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Name of the supplier',
    example: 'Eco Supplier Inc.',
  })
  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @ApiPropertyOptional({
    description: 'Address of the supplier',
    example: '123 Green St, Eco City',
  })
  supplierAddress: string;

  @ApiProperty({
    description: 'Contact details of the supplier',
    example: '+9876543210',
  })
  @IsNotEmpty()
  @IsString()
  supplierContact: string;

  @ApiProperty({
    description: 'Comoany ID of the associated company',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  companyId: number;

  @ApiProperty({
    description: 'User ID of the associated company',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  userId: number;
}
