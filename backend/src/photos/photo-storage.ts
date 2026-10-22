import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { PhotoKind } from './photo-processing';
import { readPhotoStorageConfig } from './photos.config';

const FOLDERS: Record<PhotoKind, string> = {
  avatar: 'avatars',
  workout: 'workouts',
};

// The only file names the storage ever writes. Matching a stored URL against
// it, rather than trusting the URL, is what keeps remove() inside the uploads
// directory.
const STORED_FILE = /(avatars|workouts)\/[0-9a-f-]{36}\.webp$/;

/**
 * Photos on the local disk of the API server, served by the API itself under
 * /uploads (see main.ts). Every photo gets a new random name, so a URL never
 * changes content and can be cached for good, and cannot be guessed.
 */
@Injectable()
export class PhotoStorage {
  private readonly logger = new Logger(PhotoStorage.name);
  private readonly config: ReturnType<typeof readPhotoStorageConfig>;

  constructor(config: ConfigService) {
    this.config = readPhotoStorageConfig(config);
  }

  /** Writes the photo and returns the URL to store. */
  async save(kind: PhotoKind, data: Buffer): Promise<string> {
    const key = `${FOLDERS[kind]}/${randomUUID()}.webp`;

    await mkdir(join(this.config.directory, FOLDERS[kind]), {
      recursive: true,
    });
    await writeFile(join(this.config.directory, key), data, { flag: 'wx' });
    return `${this.config.publicUrl}/${key}`;
  }

  /**
   * Deletes the file behind a stored URL. Never throws: by the time a file is
   * removed the database no longer points to it, and a leftover file is only
   * wasted space.
   */
  async remove(url: string | null | undefined): Promise<void> {
    const key = url ? STORED_FILE.exec(url)?.[0] : undefined;

    if (!key) return;
    try {
      await unlink(join(this.config.directory, key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        this.logger.warn(`Could not delete photo ${key}`);
    }
  }
}
