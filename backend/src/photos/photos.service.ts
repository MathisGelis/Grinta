import { BadRequestException, Injectable } from '@nestjs/common';
import { PhotoKind, processPhoto } from './photo-processing';
import { PhotoStorage } from './photo-storage';

@Injectable()
export class PhotosService {
  constructor(private readonly storage: PhotoStorage) {}

  /**
   * Validates, normalises and stores an uploaded photo with the thumbnail
   * that lists display, and returns both URLs. The thumbnail is made from the
   * already reduced photo rather than from the upload, which avoids decoding
   * the original twice.
   */
  async uploadWithThumbnail(
    kind: 'avatar' | 'workout',
    file: Express.Multer.File | undefined,
  ): Promise<{ url: string; thumbnailUrl: string }> {
    const thumbnailKind: PhotoKind = `${kind}_thumbnail`;
    const photo = await processPhoto(this.contentOf(file), kind);
    const thumbnail = await processPhoto(photo, thumbnailKind);
    const url = await this.storage.save(kind, photo);

    try {
      return {
        url,
        thumbnailUrl: await this.storage.save(thumbnailKind, thumbnail),
      };
    } catch (error) {
      await this.storage.remove(url);
      throw error;
    }
  }

  remove(url: string | null | undefined): Promise<void> {
    return this.storage.remove(url);
  }

  removeAll(urls: Array<string | null | undefined>): Promise<void[]> {
    return Promise.all(urls.map((url) => this.storage.remove(url)));
  }

  private contentOf(file: Express.Multer.File | undefined): Buffer {
    if (!file)
      throw new BadRequestException(
        'Aucune photo reçue : envoyez-la en multipart/form-data dans le champ « photo ».',
      );
    return file.buffer;
  }
}
