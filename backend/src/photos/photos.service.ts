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
    return this.storage.save(
      kind,
      await processPhoto(this.contentOf(file), kind),
    );
  }

  /**
   * Stores a workout photo and its thumbnail. The thumbnail is made from the
   * already reduced photo rather than from the upload, which avoids decoding
   * the original twice.
   */
  async uploadWithThumbnail(
    file: Express.Multer.File | undefined,
  ): Promise<{ photoUrl: string; photoThumbnailUrl: string }> {
    const photo = await processPhoto(this.contentOf(file), 'workout');
    const thumbnail = await processPhoto(photo, 'thumbnail');
    const photoUrl = await this.storage.save('workout', photo);

    try {
      return {
        photoUrl,
        photoThumbnailUrl: await this.storage.save('thumbnail', thumbnail),
      };
    } catch (error) {
      await this.storage.remove(photoUrl);
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
