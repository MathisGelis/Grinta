import { LocalPhotoStorage, PhotoStorage } from './photo-storage';
import type { PhotoStorageConfig } from './photos.config';
import { SupabasePhotoStorage } from './supabase-photo-storage';

export function createPhotoStorage(config: PhotoStorageConfig): PhotoStorage {
  return config.driver === 'supabase'
    ? new SupabasePhotoStorage(config)
    : new LocalPhotoStorage(config);
}
