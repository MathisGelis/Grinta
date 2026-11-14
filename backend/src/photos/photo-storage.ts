import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readdir, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import type { StoredFile } from './orphans';
import { PhotoKind } from './photo-processing';

export const PHOTO_FOLDERS = ['avatars', 'workouts'] as const;

const FOLDERS: Record<PhotoKind, (typeof PHOTO_FOLDERS)[number]> = {
  avatar: 'avatars',
  avatar_thumbnail: 'avatars',
  workout: 'workouts',
  workout_thumbnail: 'workouts',
};

// The only file names the storage ever writes. Matching a stored URL against
// it, rather than trusting the URL, is what keeps remove() inside the photo
// folders.
export const STORED_FILE = /(avatars|workouts)\/[0-9a-f-]{36}\.webp$/;

/** A new, random, never reused key: avatars/<uuid>.webp. */
export function newPhotoKey(kind: PhotoKind): string {
  return `${FOLDERS[kind]}/${randomUUID()}.webp`;
}

/** The key behind a stored URL, or undefined if the storage cannot own it. */
export function photoKeyOf(url: string | null | undefined): string | undefined {
  return url ? STORED_FILE.exec(url)?.[0] : undefined;
}

/**
 * Where photos live. Every photo gets a new random name, so a URL never
 * changes content, can be cached for good, and cannot be guessed.
 */
export abstract class PhotoStorage {
  /** Writes the photo and returns the public URL to store. */
  abstract save(kind: PhotoKind, data: Buffer): Promise<string>;

  /**
   * Deletes the file behind a stored URL. Never throws: by the time a file is
   * removed the database no longer points to it, and a leftover file is only
   * wasted space (see `npm run photos:gc`).
   */
  abstract remove(url: string | null | undefined): Promise<void>;

  /** Every stored photo, for the orphan cleanup. */
  abstract list(): Promise<StoredFile[]>;
}

/** Photos on the local disk, served by the API under /uploads (main.ts). */
export class LocalPhotoStorage extends PhotoStorage {
  private readonly logger = new Logger(LocalPhotoStorage.name);

  constructor(
    private readonly config: { directory: string; publicUrl: string },
  ) {
    super();
  }

  async save(kind: PhotoKind, data: Buffer): Promise<string> {
    const key = newPhotoKey(kind);

    await mkdir(join(this.config.directory, FOLDERS[kind]), {
      recursive: true,
    });
    await writeFile(join(this.config.directory, key), data, { flag: 'wx' });
    return `${this.config.publicUrl}/${key}`;
  }

  async remove(url: string | null | undefined): Promise<void> {
    const key = photoKeyOf(url);

    if (!key) return;
    try {
      await unlink(join(this.config.directory, key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        this.logger.warn(`Could not delete photo ${key}`);
    }
  }

  async list(): Promise<StoredFile[]> {
    const files: StoredFile[] = [];

    for (const folder of PHOTO_FOLDERS) {
      const names = await readdir(join(this.config.directory, folder)).catch(
        () => [],
      );

      for (const name of names) {
        const info = await stat(join(this.config.directory, folder, name));

        if (info.isFile())
          files.push({ key: `${folder}/${name}`, modifiedAt: info.mtimeMs });
      }
    }
    return files;
  }
}
