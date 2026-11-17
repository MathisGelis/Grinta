import { existsSync, readFileSync, writeFileSync } from 'fs';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { LocalPhotoStorage } from './photo-storage';
import { readPhotoStorageConfig } from './photos.config';

describe('LocalPhotoStorage', () => {
  let directory: string;
  let storage: LocalPhotoStorage;
  const config = (values: Record<string, string>) => {
    const read = readPhotoStorageConfig((key) => values[key]);

    if (read.driver !== 'local') throw new Error('expected local storage');
    return read;
  };

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'grinta-photos-'));
    storage = new LocalPhotoStorage(
      config({
        UPLOADS_DIR: directory,
        UPLOADS_PUBLIC_URL: 'https://api.example.com/uploads/',
      }),
    );
  });

  afterEach(() => rm(directory, { recursive: true, force: true }));

  it('writes each photo under a new random name and returns its public URL', async () => {
    const first = await storage.save('avatar', Buffer.from('one'));
    const second = await storage.save('avatar', Buffer.from('two'));

    expect(first).toMatch(
      /^https:\/\/api\.example\.com\/uploads\/avatars\/[0-9a-f-]{36}\.webp$/,
    );
    expect(second).not.toBe(first);
    const key = first.replace('https://api.example.com/uploads/', '');

    expect(readFileSync(join(directory, key), 'utf-8')).toBe('one');
  });

  it('deletes the file behind a stored URL, whatever its prefix', async () => {
    const url = await storage.save('workout', Buffer.from('photo'));
    const key = url.replace('https://api.example.com/uploads/', '');

    await storage.remove(`/uploads/${key}`);
    expect(existsSync(join(directory, key))).toBe(false);
    await expect(storage.remove(url)).resolves.toBeUndefined();
  });

  it('never deletes a file it could not have written', async () => {
    const outside = join(directory, 'keep.webp');

    writeFileSync(outside, 'keep');
    for (const url of [
      '/uploads/../keep.webp',
      '/uploads/avatars/../../keep.webp',
      '/uploads/avatars/not-a-uuid.webp',
      'https://example.com/elsewhere.jpg',
      '',
      null,
      undefined,
    ])
      await storage.remove(url);
    expect(readFileSync(outside, 'utf-8')).toBe('keep');
  });

  it('defaults to the relative /uploads URL', async () => {
    const relative = new LocalPhotoStorage(config({ UPLOADS_DIR: directory }));

    expect(await relative.save('workout', Buffer.from('x'))).toMatch(
      /^\/uploads\/workouts\/[0-9a-f-]{36}\.webp$/,
    );
  });
});
