import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PhotoStorage } from './photo-storage';
import { createPhotoStorage } from './photo-storage.factory';
import { readPhotoStorageConfig } from './photos.config';
import { PhotosService } from './photos.service';

@Module({
  providers: [
    {
      provide: PhotoStorage,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const storage = readPhotoStorageConfig((key) =>
          config.get<string>(key),
        );

        new Logger('Photos').log(
          storage.driver === 'supabase'
            ? `Photos stored in Supabase Storage, bucket "${storage.bucket}"`
            : `Photos stored on the local disk, ${storage.directory}`,
        );
        return createPhotoStorage(storage);
      },
    },
    PhotosService,
  ],
  exports: [PhotosService],
})
export class PhotosModule {}
