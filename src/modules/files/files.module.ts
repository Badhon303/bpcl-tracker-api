import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadEntity } from './entiies/file-upload.entity';
import { ServeFileController } from './serve-file.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FileUploadEntity])],
  controllers: [FilesController, ServeFileController],
  providers: [FilesService],
})
export class FilesModule {}
