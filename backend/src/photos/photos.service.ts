import { BadRequestException, Injectable } from '@nestjs/common';
import { PhotoKind, processPhoto } from './photo-processing';
import { PhotoStorage } from './photo-storage';

@Injectable()
export class PhotosService {
  constructor(private readonly storage: PhotoStorage) {}

  /** Validates, normalises and stores an uploaded photo, returns its URL. */
  async upload(
    kind: PhotoKind,
    file: Express.Multer.File | undefined,
  ): Promise<string> {
    if (!file)
      throw new BadRequestException(
        'Aucune photo reçue : envoyez-la en multipart/form-data dans le champ « photo ».',
      );
    return this.storage.save(kind, await processPhoto(file.buffer, kind));
  }

  remove(url: string | null | undefined): Promise<void> {
    return this.storage.remove(url);
  }

  removeAll(urls: Array<string | null | undefined>): Promise<void[]> {
    return Promise.all(urls.map((url) => this.storage.remove(url)));
  }
}
