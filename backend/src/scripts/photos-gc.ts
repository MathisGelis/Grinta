import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../database/database.config';
import { findOrphans } from '../photos/orphans';
import { photoKeyOf } from '../photos/photo-storage';
import { createPhotoStorage } from '../photos/photo-storage.factory';
import { readPhotoStorageConfig } from '../photos/photos.config';

// Lists, and with --delete removes, the photos no row points to any more,
// in Supabase Storage or on the local disk, whichever the API uses.
// Read-only by default.
//
//   npm run photos:gc             report only
//   npm run photos:gc -- --delete
config();

async function run() {
  const remove = process.argv.includes('--delete');
  const storageConfig = readPhotoStorageConfig((key) => process.env[key]);
  const storage = createPhotoStorage(storageConfig);
  const where =
    storageConfig.driver === 'supabase'
      ? `Supabase bucket "${storageConfig.bucket}"`
      : storageConfig.directory;
  const dataSource = new DataSource({
    ...buildDatabaseOptions((key, fallback) => process.env[key] ?? fallback),
    entities: [],
    migrations: [],
    synchronize: false,
  });

  await dataSource.initialize();
  const rows: Array<{ url: string }> = await dataSource.query(
    `SELECT url FROM users, unnest(ARRAY["avatarUrl", "avatarThumbnailUrl"]) AS url
      WHERE url IS NOT NULL
     UNION ALL
     SELECT url FROM completed_workouts, unnest(ARRAY["photoUrl", "photoThumbnailUrl"]) AS url
      WHERE url IS NOT NULL`,
  );

  await dataSource.destroy();
  const files = await storage.list();
  const orphans = findOrphans(
    files,
    rows.map((r) => r.url),
    Date.now(),
  );
  const keys = new Set(files.map((f) => f.key));
  const missing = rows.filter((r) => !keys.has(photoKeyOf(r.url) ?? '')).length;

  console.log(
    `${where}: ${files.length} files, ${rows.length} referenced, ${orphans.length} orphaned, ${missing} referenced but missing`,
  );
  if (!remove) {
    if (orphans.length) console.log('Run with --delete to remove the orphans');
    return;
  }
  // remove() takes a URL or a bare key and never deletes outside the photo
  // folders.
  for (const orphan of orphans) await storage.remove(orphan.key);
  console.log(`Deleted ${orphans.length} orphaned files`);
}

run().catch((err) => {
  console.error('Photo cleanup failed', err);
  process.exit(1);
});
