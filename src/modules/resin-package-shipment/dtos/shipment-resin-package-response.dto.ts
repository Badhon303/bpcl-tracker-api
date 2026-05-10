import { ApiProperty } from '@nestjs/swagger';
import { ResinPackageResponseDTO } from 'src/modules/resin-package/dtos/resin-package-response.dto';

export class ShipmentResinPackageResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the shipment preprduct package',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the bale owning the resin package ID',
    example: 1,
    type: Number,
  })
  resinPackageId: number;

  @ApiProperty({
    description: 'ID of the resin shipment ID',
    example: 1,
    type: Number,
  })
  resinPackageShipmentId: number;

  @ApiProperty({
    description: 'Resin package associated with the resin shipment',
    type: ResinPackageResponseDTO,
  })
  resinPackage: ResinPackageResponseDTO;
}
