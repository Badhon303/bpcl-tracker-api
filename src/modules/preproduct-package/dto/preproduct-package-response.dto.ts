import { ApiProperty } from '@nestjs/swagger';
import { PreproductResponseDTO } from 'src/modules/preproduct/dto/preproduct-response.dto';
import { Status } from '../enum/status.enum';
import { IsEnum } from 'class-validator';

export class PreproductPackageResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the package',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Preproduct ID for the package',
    example: 2,
  })
  preproductId: number;

  @ApiProperty({
    description: 'Type of product (e.g., White bottle)',
    example: 'White Bottle',
    type: String,
  })
  productType: string;

  @ApiProperty({
    description: 'Package Weight',
    example: 25,
  })
  packageWeight: number;

  @ApiProperty({
    description:
      'ID of the remaining preproduct which will be merged in another preproduct',
    example: 1,
    type: Number,
    required: false,
  })
  remainingPreproductId: number;

  @ApiProperty({
    description: 'Remaining weight of the remaining preproduct',
    example: 10,
    required: false,
  })
  remainingWeight: number;

  @ApiProperty({
    enum: Status,
    example: Status.InStock,
  })
  @IsEnum(Status)
  status: Status;

  @ApiProperty({
    description: 'OCean bound weight',
    example: 25,
    required: false,
  })
  oceanBoundWeight: number;

  @ApiProperty({
    description: 'Ocean bound percentage',
    example: 25,
    required: false,
  })
  OceanBoundPercentage: number;

  @ApiProperty({
    description: 'Date and time when the package was created',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'ID of the user who created the package',
    example: 1,
    type: Number,
  })
  createdBy: number;

  @ApiProperty({
    description: 'Date and time when the package was last updated',
    example: '2025-07-22T15:43:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the user who last updated the package',
    example: 1,
    type: Number,
  })
  updatedBy: number;

  @ApiProperty({
    description: 'ID of the company owning the package',
    example: 1,
    type: Number,
  })
  companyId: number;

  @ApiProperty({
    description: 'ID of the user associated with the package',
    example: 1,
    type: Number,
  })
  userId: number;

  @ApiProperty({
    description: 'Preproduct associated with the package',
    type: () => PreproductResponseDTO,
  })
  preproduct: PreproductResponseDTO;

  @ApiProperty({
    description: 'Preproduct associated with the package',
    type: () => PreproductResponseDTO,
    required: false,
  })
  remainingPreproduct: PreproductResponseDTO;
}
