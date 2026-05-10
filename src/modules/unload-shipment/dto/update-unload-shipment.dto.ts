import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class updatedUnloadShipmentDTO {
  @ApiProperty({
    description: 'Weight of the container',
    example: 500.75,
  })
  @IsNumber()
  @IsNotEmpty()
  totalWeightAfterUnload: number;

  @ApiProperty({
    description: 'Unloading note',
    example: 'Everything is ok',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  unloadingNote?: string;
}
