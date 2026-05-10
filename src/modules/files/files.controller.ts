import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  BpclRequestLogInterceptor,
  SwaggerResponseType,
  TransformInterceptor,
} from 'bpcl/common';
import * as multer from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileResponseDTO } from './dto/file-response.dto';
import { FilesService } from './files.service';

@ApiTags('File')
@Controller('files')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor, BpclRequestLogInterceptor)
export class FilesController {
  constructor(
    private filesService: FilesService,
    private readonly configService: ConfigService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: () => SwaggerResponseType(FileResponseDTO),
  })
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: 'uploads',
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          return cb(null, 'uploads');
        },
        filename: (req, file, cb) => {
          cb(null, uuidv4() + path.extname(file.originalname));
        },
      }),
    }),
  )
  public uploadFile(@UploadedFile() file, @Headers('host') host: string): any {
    return this.filesService.saveFile(file, host);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: () => SwaggerResponseType(FileResponseDTO),
  })
  @Get('/resources/:resourceId')
  getByResourceId(@Param('resourceId') resourceId: string): any {
    return this.filesService.getFilesByResourceId(resourceId);
  }
}
