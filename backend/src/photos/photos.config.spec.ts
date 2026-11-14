import { readPhotoStorageConfig } from './photos.config';

const from = (env: Record<string, string>) => (key: string) => env[key];

describe('readPhotoStorageConfig', () => {
  it('uses Supabase Storage as soon as SUPABASE_URL is set', () => {
    expect(
      readPhotoStorageConfig(
        from({
          SUPABASE_URL: 'https://ref.supabase.co/',
          SUPABASE_SERVICE_ROLE_KEY: 'key',
        }),
      ),
    ).toEqual({
      driver: 'supabase',
      url: 'https://ref.supabase.co',
      serviceKey: 'key',
      bucket: 'photos',
    });
  });

  it('refuses to start on Supabase without the service key', () => {
    expect(() =>
      readPhotoStorageConfig(from({ SUPABASE_URL: 'https://ref.supabase.co' })),
    ).toThrow('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('falls back to the local disk without Supabase settings', () => {
    expect(readPhotoStorageConfig(from({})).driver).toBe('local');
  });

  it('lets PHOTOS_STORAGE force the local disk', () => {
    expect(
      readPhotoStorageConfig(
        from({
          PHOTOS_STORAGE: 'local',
          SUPABASE_URL: 'https://ref.supabase.co',
        }),
      ).driver,
    ).toBe('local');
  });
});
