import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { PhotosService } from './photos.service';

describe('PhotosService', () => {
  const storage = { save: jest.fn(), remove: jest.fn() };
  const service = new PhotosService(storage as never);
  let file: Express.Multer.File;

  beforeAll(async () => {
    const buffer = await sharp({
      create: { width: 2000, height: 1000, channels: 3, background: '#888' },
    })
      .jpeg()
      .toBuffer();

    file = { buffer } as Express.Multer.File;
  });

  beforeEach(() => jest.clearAllMocks());

  it('stores the photo and its thumbnail', async () => {
    storage.save
      .mockResolvedValueOnce('/uploads/workouts/photo.webp')
      .mockResolvedValueOnce('/uploads/workouts/thumb.webp');

    await expect(service.uploadWithThumbnail(file)).resolves.toEqual({
      photoUrl: '/uploads/workouts/photo.webp',
      photoThumbnailUrl: '/uploads/workouts/thumb.webp',
    });
    const [[, photo], [, thumbnail]] = storage.save.mock.calls as Array<
      [string, Buffer]
    >;

    expect((await sharp(photo).metadata()).width).toBe(1600);
    expect((await sharp(thumbnail).metadata()).width).toBe(600);
  });

  it('deletes the photo when the thumbnail cannot be written', async () => {
    storage.save
      .mockResolvedValueOnce('/uploads/workouts/photo.webp')
      .mockRejectedValueOnce(new Error('disk full'));

    await expect(service.uploadWithThumbnail(file)).rejects.toThrow(
      'disk full',
    );
    expect(storage.remove).toHaveBeenCalledWith('/uploads/workouts/photo.webp');
  });

  it('refuses a request without a photo', async () => {
    await expect(service.uploadWithThumbnail(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storage.save).not.toHaveBeenCalled();
  });
});
