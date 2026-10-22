import { config } from 'dotenv';
import { readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../database/database.config';
import { findOrphans, StoredFile } from '../photos/orphans';
import { readPhotoStorageConfig } from '../photos/photos.config';

// Lists, and with --delete removes, the photo files no row points to any
// more. Read-only by default.
//
//   npm run photos:gc             report only
//   npm run photos:gc -- --delete
config();

const FOLDERS = ['avatars', 'workouts'];

async function listFiles(directory: string): Promise<StoredFile[]> {
  const files: StoredFile[] = [];

  for (const folder of FOLDERS) {
    const names = await readdir(join(directory, folder)).catch(() => []);

    for (const name of names) {
      const info = await stat(join(directory, folder, name));

      if (info.isFile())
        files.push({ key: `${folder}/${name}`, modifiedAt: info.mtimeMs });
    }
  }
  return files;
}

async function run() {
  const remove = process.argv.includes('--delete');
  const { directory } = readPhotoStorageConfig({
    get: (key: string) => process.env[key],
  } as never);
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
  const files = await listFiles(directory);
  const orphans = findOrphans(
    files,
    rows.map((r) => r.url),
    Date.now(),
  );
  const keys = new Set(files.map((f) => f.key));
  const missing = rows.filter(
    (r) => !keys.has(r.url.replace(/^.*\/(avatars|workouts)\//, '$1/')),
  ).length;

  console.log(
    `${directory}: ${files.length} files, ${rows.length} referenced, ${orphans.length} orphaned, ${missing} referenced but missing`,
  );
  if (!remove) {
    if (orphans.length) console.log('Run with --delete to remove the orphans');
    return;
  }
  for (const orphan of orphans) await unlink(join(directory, orphan.key));
  console.log(`Deleted ${orphans.length} orphaned files`);
}

run().catch((err) => {
  console.error('Photo cleanup failed', err);
  process.exit(1);
});
