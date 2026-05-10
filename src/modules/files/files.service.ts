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
import { ConfigService } from '@nestjs/config';
import { FileUploadEntity } from './entiies/file-upload.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileUploadEntity)
    private readonly fileUploadRepository: Repository<FileUploadEntity>,
    private readonly configService: ConfigService,
  ) {}

  private getBaseUrl(host?: string): string {
    const fileServerHost = this.configService.get('FILE_SERVER_HOST');
    if (fileServerHost) {
      return `${fileServerHost}/api/v1/file-serve`;
    }
    return `http://${host || 'localhost:3300'}/api/v1/file-serve`;
  }

  async saveFile(file: Record<string, any>, host?: string) {
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
    const baseUrl = this.getBaseUrl(host);
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

    const baseUrl = this.getBaseUrl();
    file.url = `${baseUrl}/${file.filename}`;

    return file;
  }
}
