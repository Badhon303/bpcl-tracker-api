import { ApiProperty } from '@nestjs/swagger';
import { ResinDhopeResponseDTO } from 'src/modules/resin-dhope/dtos/resin-dhope-response.dto';

export class ResinPackageResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the resin package',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Resin dhope ID for the package',
    example: 2,
  })
  resinDhopeId: number;

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
      'ID of the remaining resin dhope which will be merged in another resin dhope',
    example: 1,
    type: Number,
    required: false,
  })
  remainingResinDhopeId: number;

  @ApiProperty({
    description: 'Remaining weight of the remaining resin dhope',
    example: 10,
    required: false,
  })
  remainingWeight: number;

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
    description: 'Resin dhope associated with the resin package',
    type: () => ResinDhopeResponseDTO,
  })
  resinDhope: ResinDhopeResponseDTO;

  @ApiProperty({
    description: 'Last resin dhope associated with the resin package',
    type: () => ResinDhopeResponseDTO,
    required: false,
  })
  remainingResinDhope: ResinDhopeResponseDTO;
}
