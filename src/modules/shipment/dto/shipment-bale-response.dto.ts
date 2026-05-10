import { ApiProperty } from '@nestjs/swagger';
import { BaleResponseDTO } from 'src/modules/bale/dto/bale-response.dto';

export class ShipmentBaleResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the shipment',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the bale owning the shipment',
    example: 1,
    type: Number,
  })
  baleId: number;

  @ApiProperty({
    description: 'ID of the shipment',
    example: 1,
    type: Number,
  })
  shipmentId: number;

  @ApiProperty({
    description: 'Shipment bale weight',
    example: 1000,
    type: Number,
  })
  shipmentBaleWeight: number;

  @ApiProperty({
    description: 'Bale associated with the shipment',
    type: BaleResponseDTO,
  })
  bale: BaleResponseDTO;
}
