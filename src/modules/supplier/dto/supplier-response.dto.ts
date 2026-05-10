import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';
import { CompanyResponseDTO } from 'src/modules/company/dto/company-response.dto';

export class SupplierResponseDTO {
  @ApiProperty({
    description: 'Unique ID for the supplier',
    example: 1,
  })
  @IsInt()
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Unique display ID for the supplier',
    example: '001',
    type: String,
  })
  @IsString()
  @Expose()
  supplierDisplayId: string;

  @ApiProperty({
    description: 'Category of the supplier',
    example: 'Plastic Recycling',
  })
  @IsString()
  @Expose()
  category: string;

  @ApiProperty({
    description: 'Name of the supplier',
    example: 'Eco Supplier Inc.',
  })
  @IsString()
  @Expose()
  supplierName: string;

  @ApiProperty({
    description: 'Address of the supplier',
    example: '123 Green St, Eco City',
  })
  @IsString()
  @Expose()
  supplierAddress: string;

  @ApiProperty({
    description: 'Contact details of the supplier',
    example: '+9876543210',
  })
  @IsString()
  @Expose()
  supplierContact: string;

  @ApiProperty({
    description: 'Company ID associated with the supplier',
    example: 1,
  })
  @IsInt()
  @Expose()
  companyId: number;

  @ApiProperty({
    description: 'User ID associated with the supplier',
    example: 1,
  })
  @IsInt()
  @Expose()
  userId: number;

  @ApiProperty({
    description: 'Comapny associated with the supplier',
    example: 'BPCL',
  })
  @IsString()
  @Expose()
  // @Transform(({ obj }) => obj.company?.name)
  companyName: string;

  @Exclude()
  company: any;
}
