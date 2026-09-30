import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class BacktrackQueryDTO {
  @ApiProperty({
    description: 'Company ID used for the backtrack request',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsNotEmpty()
  companyId: number;
}
