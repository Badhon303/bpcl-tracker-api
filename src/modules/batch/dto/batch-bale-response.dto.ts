import { ApiProperty } from '@nestjs/swagger';
import { BaleResponseDTO } from 'src/modules/bale/dto/bale-response.dto';

export class BatchBaleResponseDTO {
  @ApiProperty({
    description: 'Unique ID of the batch bale',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the bale owning the batch',
    example: 1,
    type: Number,
  })
  baleId: number;

  @ApiProperty({
    description: 'ID of the batch',
    example: 1,
    type: Number,
  })
  batchId: number;

  @ApiProperty({
    description: 'Bale associated with the batch',
    type: BaleResponseDTO,
  })
  bale: BaleResponseDTO;
}
