import { ApiProperty } from '@nestjs/swagger';
import { BaleResponseDTO } from 'src/modules/bale/dto/bale-response.dto';
import { PreproductPackageResponseDTO } from 'src/modules/preproduct-package/dto/preproduct-package-response.dto';

export class ShipmentPreproductPackageResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the shipment preprduct package',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the bale owning the preproduct package ID',
    example: 1,
    type: Number,
  })
  preproductPackageId: number;

  @ApiProperty({
    description: 'ID of the preproduct shipment ID',
    example: 1,
    type: Number,
  })
  preproductShipmentId: number;

  @ApiProperty({
    description: 'Preproduct package associated with the preproduct shipment',
    type: PreproductPackageResponseDTO,
  })
  preproductPackage: PreproductPackageResponseDTO;
}
