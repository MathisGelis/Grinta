import { resolve } from 'path';
import { ConfigService } from '@nestjs/config';

/** Path under which the API serves the uploads directory. */
export const UPLOADS_ROUTE = '/uploads';

export interface PhotoStorageConfig {
  /** Absolute directory holding the photos, one subdirectory per kind. */
  directory: string;
  /** Prefix of the URLs stored in the database, without a trailing slash. */
  publicUrl: string;
}

/**
 * UPLOADS_DIR defaults to `uploads` in the working directory, which is
 * backend/ under PM2: outside dist/, so a build never wipes it. It must be
 * backed up, it is the only copy of the photos. UPLOADS_PUBLIC_URL defaults to
 * the relative path the API serves the files under; set it to an absolute URL
 * (https://<api host>/uploads) so the app can display the photos as they are.
 */
export function readPhotoStorageConfig(
  config: ConfigService,
): PhotoStorageConfig {
  return {
    directory: resolve(config.get<string>('UPLOADS_DIR') || 'uploads'),
    publicUrl: (
      config.get<string>('UPLOADS_PUBLIC_URL') || UPLOADS_ROUTE
    ).replace(/\/+$/, ''),
  };
}
