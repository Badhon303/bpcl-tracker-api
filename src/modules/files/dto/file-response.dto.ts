import { ApiResponseProperty } from '@nestjs/swagger';

export class FileResponseDTO {
  @ApiResponseProperty()
  file_id: string;

  @ApiResponseProperty()
  resource_id: string;

  @ApiResponseProperty()
  resource_type: string;

  @ApiResponseProperty()
  filename: string;

  @ApiResponseProperty()
  originalname: string;

  @ApiResponseProperty()
  mimetype: string;

  @ApiResponseProperty()
  encoding: string;

  @ApiResponseProperty()
  size: string;

  @ApiResponseProperty()
  url: string;
}
