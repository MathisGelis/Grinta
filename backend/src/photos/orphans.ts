import { STORED_FILE } from './photo-storage';

export interface StoredFile {
  /** Path relative to the uploads directory, e.g. avatars/<uuid>.webp. */
  key: string;
  modifiedAt: number;
}

/**
 * Upload in flight: a photo is written before the row that points to it is
 * updated, so a file younger than this may simply not be referenced yet.
 */
export const ORPHAN_GRACE_MS = 60 * 60_000;

/**
 * Files of the uploads directory that no row points to any more, which only
 * happens when the process died between writing a file and saving its URL,
 * or between clearing a URL and deleting its file. Files the storage could
 * not have written are never returned, so the caller cannot delete them.
 */
export function findOrphans(
  files: StoredFile[],
  storedUrls: Array<string | null>,
  now: number,
): StoredFile[] {
  const referenced = new Set(
    storedUrls.map((url) => (url ? STORED_FILE.exec(url)?.[0] : undefined)),
  );

  return files.filter(
    (file) =>
      STORED_FILE.exec(file.key)?.[0] === file.key &&
      !referenced.has(file.key) &&
      now - file.modifiedAt > ORPHAN_GRACE_MS,
  );
}
