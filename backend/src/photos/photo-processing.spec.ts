import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import sharp from 'sharp';
import { processPhoto } from './photo-processing';

const picture = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#c03030' } });

describe('processPhoto', () => {
  it('crops an avatar to a 512 px WebP square', async () => {
    const output = await processPhoto(
      await picture(3000, 2000).jpeg().toBuffer(),
      'avatar',
    );
    const metadata = await sharp(output).metadata();

    expect([metadata.format, metadata.width, metadata.height]).toEqual([
      'webp',
      512,
      512,
    ]);
  });

  it('scales a workout photo down to 1600 px, keeping its proportions', async () => {
    const output = await processPhoto(
      await picture(4000, 3000).png().toBuffer(),
      'workout',
    );
    const metadata = await sharp(output).metadata();

    expect([metadata.format, metadata.width, metadata.height]).toEqual([
      'webp',
      1600,
      1200,
    ]);
  });

  it('makes a 600 px thumbnail several times lighter than the photo', async () => {
    const photo = await processPhoto(
      await picture(4000, 3000)
        .composite([
          {
            input: Buffer.from(
              '<svg width="4000" height="3000"><circle cx="2000" cy="1500" r="1200" fill="#2050d0"/><rect x="300" y="300" width="900" height="500" fill="#f0c020"/></svg>',
            ),
          },
        ])
        .jpeg()
        .toBuffer(),
      'workout',
    );
    const thumbnail = await processPhoto(photo, 'thumbnail');
    const metadata = await sharp(thumbnail).metadata();

    expect([metadata.format, metadata.width, metadata.height]).toEqual([
      'webp',
      600,
      450,
    ]);
    expect(thumbnail.length * 3).toBeLessThan(photo.length);
  });

  it('never enlarges a small workout photo', async () => {
    const output = await processPhoto(
      await picture(400, 300).webp().toBuffer(),
      'workout',
    );

    expect((await sharp(output).metadata()).width).toBe(400);
  });

  it('applies the EXIF orientation, then drops every metadata', async () => {
    const input = await picture(300, 200)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .withExif({ IFD0: { Make: 'Phone', Copyright: 'Owner' } })
      .toBuffer();
    const before = await sharp(input).metadata();

    expect(before.exif).toBeDefined();
    const after = await sharp(await processPhoto(input, 'workout')).metadata();

    expect([after.width, after.height]).toEqual([200, 300]);
    expect(after.orientation).toBeUndefined();
    expect(after.exif).toBeUndefined();
    expect(after.icc).toBeUndefined();
    expect(after.xmp).toBeUndefined();
  });

  it('refuses a file that is not an image', async () => {
    await expect(
      processPhoto(Buffer.from('definitely not a photo'), 'avatar'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a truncated image', async () => {
    const jpeg = await picture(400, 400).jpeg().toBuffer();

    await expect(
      processPhoto(jpeg.subarray(0, 300), 'avatar'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses formats other than JPEG, PNG and WebP, SVG included', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
    );

    for (const input of [
      svg,
      await picture(10, 10).gif().toBuffer(),
      await picture(10, 10).avif().toBuffer(),
    ])
      await expect(processPhoto(input, 'avatar')).rejects.toBeInstanceOf(
        UnsupportedMediaTypeException,
      );
  });

  it('refuses a picture over 50 megapixels before decoding it', async () => {
    // 56 MP in a file of a few hundred kB: what a decompression bomb looks like.
    const huge = await picture(8000, 7000).png().toBuffer();

    expect(huge.length).toBeLessThan(1024 * 1024);
    await expect(processPhoto(huge, 'workout')).rejects.toBeInstanceOf(
      PayloadTooLargeException,
    );
  });
});
