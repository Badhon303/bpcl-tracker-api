import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { BpclRequestLogInterceptor } from 'bpcl/common';
import { Response } from 'express';
import { promises } from 'fs';
import { resolve } from 'path';

@UseInterceptors(BpclRequestLogInterceptor)
@Controller('file-serve')
export class ServeFileController {
  @Get(':fileName')
  public async getFile(
    @Param('fileName') fileName: string,
    @Res() response: Response,
  ) {
    try {
      const stat = await promises.lstat(`uploads/${fileName}`);
      if (!stat.isFile()) {
        throw new NotFoundException('Resource not found');
      }

      response.sendFile(resolve(`uploads/${fileName}`));
    } catch (err) {
      throw new NotFoundException('Resource not found');
    }
  }
}
