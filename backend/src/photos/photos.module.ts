import { Module } from '@nestjs/common';
import { PhotoStorage } from './photo-storage';
import { PhotosService } from './photos.service';

@Module({
  providers: [PhotoStorage, PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
