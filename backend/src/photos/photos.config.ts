import { resolve } from 'path';

/** Path under which the API serves the uploads directory (local storage). */
export const UPLOADS_ROUTE = '/uploads';

export type PhotoStorageConfig =
  | {
      driver: 'local';
      /** Absolute directory holding the photos, one subdirectory per kind. */
      directory: string;
      /** Prefix of the URLs stored in the database, without trailing slash. */
      publicUrl: string;
    }
  | {
      driver: 'supabase';
      /** Project URL, https://<ref>.supabase.co, without trailing slash. */
      url: string;
      /** Service role key (legacy JWT) or secret key (sb_secret_...). */
      serviceKey: string;
      /** Public bucket holding the photos. */
      bucket: string;
    };

type EnvGetter = (key: string) => string | undefined;

/**
 * Where photos are stored. PHOTOS_STORAGE picks the driver; without it,
 * Supabase Storage is used as soon as SUPABASE_URL is set, and the local disk
 * otherwise (development).
 *
 * Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server side only, never
 * in the app: it bypasses every access rule), SUPABASE_STORAGE_BUCKET
 * (default `photos`, a public bucket, see `npm run photos:setup`).
 *
 * Local disk: UPLOADS_DIR defaults to `uploads` in the working directory and
 * UPLOADS_PUBLIC_URL to the relative path the API serves it under.
 */
export function readPhotoStorageConfig(get: EnvGetter): PhotoStorageConfig {
  const driver =
    get('PHOTOS_STORAGE') || (get('SUPABASE_URL') ? 'supabase' : 'local');

  if (driver === 'local')
    return {
      driver,
      directory: resolve(get('UPLOADS_DIR') || 'uploads'),
      publicUrl: (get('UPLOADS_PUBLIC_URL') || UPLOADS_ROUTE).replace(
        /\/+$/,
        '',
      ),
    };
  if (driver !== 'supabase')
    throw new Error(`PHOTOS_STORAGE must be "supabase" or "local"`);
  const url = get('SUPABASE_URL')?.replace(/\/+$/, '');
  const serviceKey = get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey)
    throw new Error(
      'Photo storage on Supabase needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    );
  return {
    driver,
    url,
    serviceKey,
    bucket: get('SUPABASE_STORAGE_BUCKET') || 'photos',
  };
}
