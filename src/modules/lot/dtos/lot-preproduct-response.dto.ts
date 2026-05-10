import { ApiProperty } from '@nestjs/swagger';
import { PreproductResponseDTO } from 'src/modules/preproduct/dto/preproduct-response.dto';

export class LotPreproductResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the lot preproduct',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the preproduct owning the lot',
    example: 1,
    type: Number,
  })
  preproductId: number;

  @ApiProperty({
    description: 'ID of the lot',
    example: 1,
    type: Number,
  })
  lotId: number;

  @ApiProperty({
    description: 'Preproduct associated with the lot',
    type: PreproductResponseDTO,
  })
  preproduct: PreproductResponseDTO;
}
