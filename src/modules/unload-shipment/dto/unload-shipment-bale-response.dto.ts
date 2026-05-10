import { ApiProperty } from '@nestjs/swagger';
import { BaleResponseDTO } from 'src/modules/bale/dto/bale-response.dto';

export class UnloadShipmentBaleResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the unload shipment',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the bale owning the unload shipment',
    example: 1,
    type: Number,
  })
  baleId: number;

  @ApiProperty({
    description: 'ID of the unload shipment',
    example: 1,
    type: Number,
  })
  unloadShipmentId: number;

  @ApiProperty({
    description: 'Bale associated with the unload shipment',
    type: BaleResponseDTO,
  })
  bale: BaleResponseDTO;

  @ApiProperty({
    description: 'Weight of the shipment',
    type: Number,
  })
  weight: number;
}
