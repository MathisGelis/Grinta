import { config } from 'dotenv';
import sharp from 'sharp';
import { readPhotoStorageConfig } from '../photos/photos.config';
import { SupabasePhotoStorage } from '../photos/supabase-photo-storage';

// Prepares and checks the photo storage, from the server that runs the API:
// creates the Supabase bucket if it is missing (public, WebP only, 5 MB per
// file), makes it public if it is not, then uploads a tiny photo, reads it
// back through its public URL and deletes it. Safe to run again.
//
//   npm run photos:setup
config();

const BUCKET_OPTIONS = {
  public: true,
  file_size_limit: 5 * 1024 * 1024,
  allowed_mime_types: ['image/webp'],
};

async function run() {
  const settings = readPhotoStorageConfig((key) => process.env[key]);

  if (settings.driver !== 'supabase') {
    console.log(
      `Photos are stored on the local disk (${settings.directory}). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use Supabase Storage.`,
    );
    return;
  }
  const storage = new SupabasePhotoStorage(settings);
  const { bucket } = settings;
  const existing = await storage.request('GET', `/bucket/${bucket}`, {});

  if (existing.ok) {
    const info = (await existing.json()) as { public?: boolean };

    if (info.public) console.log(`Bucket "${bucket}" exists and is public`);
    else {
      const updated = await storage.request(
        'PUT',
        `/bucket/${bucket}`,
        { 'Content-Type': 'application/json' },
        JSON.stringify(BUCKET_OPTIONS),
      );

      if (!updated.ok)
        throw new Error(
          `Could not make the bucket public: ${updated.status} ${await updated.text()}`,
        );
      console.log(`Bucket "${bucket}" made public`);
    }
  } else {
    const created = await storage.request(
      'POST',
      '/bucket',
      { 'Content-Type': 'application/json' },
      JSON.stringify({ id: bucket, name: bucket, ...BUCKET_OPTIONS }),
    );

    if (!created.ok)
      throw new Error(
        `Could not create the bucket: ${created.status} ${await created.text()}`,
      );
    console.log(`Bucket "${bucket}" created, public, WebP only, 5 MB per file`);
  }

  const probe = await sharp({
    create: { width: 8, height: 8, channels: 3, background: '#000' },
  })
    .webp()
    .toBuffer();
  const url = await storage.save('avatar', probe);
  const read = await fetch(url);

  await storage.remove(url);
  if (!read.ok || read.headers.get('content-type') !== 'image/webp')
    throw new Error(
      `Uploaded, but the public URL answers ${read.status} ${read.headers.get('content-type')}: ${url}`,
    );
  console.log(
    `Upload, public read and delete work: ${url.replace(/\/[^/]+$/, '/...')}`,
  );
}

run().catch((error) => {
  console.error('Photo storage setup failed:', (error as Error).message);
  process.exit(1);
});
