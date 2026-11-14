import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { StoredFile } from './orphans';
import { PhotoKind } from './photo-processing';
import {
  newPhotoKey,
  PHOTO_FOLDERS,
  photoKeyOf,
  PhotoStorage,
} from './photo-storage';

const TIMEOUT_MS = 15_000;
const LIST_PAGE = 1000;

/**
 * Photos in a public Supabase Storage bucket, through the Storage REST API:
 * the API uploads and deletes with the service key, and the app loads the
 * public URL straight from Supabase's CDN. The key never leaves the server.
 */
export class SupabasePhotoStorage extends PhotoStorage {
  private readonly logger = new Logger(SupabasePhotoStorage.name);

  constructor(
    private readonly config: {
      url: string;
      serviceKey: string;
      bucket: string;
    },
  ) {
    super();
  }

  async save(kind: PhotoKind, data: Buffer): Promise<string> {
    const key = newPhotoKey(kind);
    const response = await this.request(
      'POST',
      `/object/${this.config.bucket}/${key}`,
      {
        'Content-Type': 'image/webp',
        // A key is never reused, so its content can be cached for good.
        'Cache-Control': 'max-age=31536000',
        'x-upsert': 'false',
      },
      data,
    ).catch(() => null);

    if (!response?.ok) {
      this.logger.error(
        `Upload of ${key} failed: ${response ? `${response.status} ${await response.text()}` : 'no response'}`,
      );
      throw new ServiceUnavailableException(
        'Le stockage des photos est momentanément indisponible, réessayez plus tard.',
      );
    }
    return this.publicUrl(key);
  }

  async remove(url: string | null | undefined): Promise<void> {
    const key = photoKeyOf(url);

    if (!key) return;
    const response = await this.request(
      'DELETE',
      `/object/${this.config.bucket}`,
      { 'Content-Type': 'application/json' },
      JSON.stringify({ prefixes: [key] }),
    ).catch(() => null);

    if (!response?.ok)
      this.logger.warn(
        `Could not delete photo ${key}: ${response?.status ?? 'no response'}`,
      );
  }

  async list(): Promise<StoredFile[]> {
    const files: StoredFile[] = [];

    for (const folder of PHOTO_FOLDERS)
      for (let offset = 0; ; offset += LIST_PAGE) {
        const response = await this.request(
          'POST',
          `/object/list/${this.config.bucket}`,
          { 'Content-Type': 'application/json' },
          JSON.stringify({
            prefix: folder,
            limit: LIST_PAGE,
            offset,
            sortBy: { column: 'name', order: 'asc' },
          }),
        );

        if (!response.ok)
          throw new Error(`Listing ${folder} failed: ${response.status}`);
        const page = (await response.json()) as Array<{
          name: string;
          id: string | null;
          created_at: string | null;
        }>;

        // Entries without id are sub-folders, not files.
        for (const object of page)
          if (object.id)
            files.push({
              key: `${folder}/${object.name}`,
              modifiedAt: Date.parse(object.created_at ?? '') || Date.now(),
            });
        if (page.length < LIST_PAGE) break;
      }
    return files;
  }

  publicUrl(key: string): string {
    return `${this.config.url}/storage/v1/object/public/${this.config.bucket}/${key}`;
  }

  /**
   * A call to the Storage API. A legacy service_role key is a JWT and goes in
   * both headers; a new secret key (sb_secret_...) is not a JWT and only goes
   * in `apikey`, the gateway turns it into a service role session.
   */
  request(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: Buffer | string,
  ): Promise<Response> {
    const key = this.config.serviceKey;

    return fetch(`${this.config.url}/storage/v1${path}`, {
      method,
      headers: {
        apikey: key,
        ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }),
        ...headers,
      },
      body: typeof body === 'string' ? body : body && new Uint8Array(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }
}
