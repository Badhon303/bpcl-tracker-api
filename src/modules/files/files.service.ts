import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import * as path from 'path';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadEntity } from './entiies/file-upload.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileUploadEntity)
    private readonly fileUploadRepository: Repository<FileUploadEntity>,
  ) {}

  async saveFile(file: Record<string, any>, baseUrl: string) {
    const fileResource = new FileUploadEntity();
    fileResource.file_id = path.basename(
      file.filename,
      path.extname(file.filename),
    );
    fileResource.filename = file.filename;
    fileResource.encoding = file.encoding;
    fileResource.mimetype = file.mimetype;
    fileResource.originalname = file.originalname;
    fileResource.size = file.size;
    fileResource.resource_id = uuidv4();
    fileResource.resource_type = path.extname(file.filename).replace(/\./g, '');
    fileResource.created_at = new Date() as any;
    fileResource.url = `${baseUrl}/${file.filename}`;

    await this.fileUploadRepository.save(fileResource);

    return fileResource;
  }

  public async getFilesByResourceId(
    resourceId: string,
  ): Promise<FileUploadEntity> {
    if (!isUUID(resourceId)) {
      throw new BadRequestException(
        'Invalid resource ID: must be a valid UUID',
      );
    }
    const file = await this.fileUploadRepository.findOne({
      where: { resource_id: resourceId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }
}
