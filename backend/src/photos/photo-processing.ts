import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import sharp from 'sharp';

export type PhotoKind =
  | 'avatar'
  | 'avatar_thumbnail'
  | 'workout'
  | 'workout_thumbnail';

/**
 * Largest picture accepted, in pixels. A 48 MP phone photo fits; the limit is
 * there because a small PNG can declare huge dimensions and decoding it would
 * exhaust the memory of the VM.
 */
export const MAX_INPUT_PIXELS = 50_000_000;

const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

const OUTPUT: Record<PhotoKind, sharp.ResizeOptions & { quality: number }> = {
  // Square, cropped around the centre: the app shows avatars in a circle.
  avatar: { width: 512, height: 512, fit: 'cover', quality: 80 },
  // What lists show (followers, comments, feeds): about 5 KB instead of 50.
  avatar_thumbnail: { width: 128, height: 128, fit: 'cover', quality: 75 },
  // Kept whole, only scaled down so a phone photo stays a few hundred kB.
  workout: {
    width: 1600,
    height: 1600,
    fit: 'inside',
    withoutEnlargement: true,
    quality: 80,
  },
  // What lists and feeds show. Every photo displayed is a download, so this
  // version, about a fifth of the full one, is what keeps the bandwidth of
  // a scrolling feed down; the full photo is for the workout screen only.
  workout_thumbnail: {
    width: 600,
    height: 600,
    fit: 'inside',
    withoutEnlargement: true,
    quality: 70,
  },
};

/**
 * Turns an uploaded file into the WebP picture that is stored. Decoding and
 * re-encoding is what makes uploads safe to serve: the stored file is always
 * an image the server produced, never the bytes the client sent, and it
 * carries no metadata, so the GPS position and the device that phone photos
 * embed in their EXIF never leave the server. The EXIF orientation is applied
 * to the pixels before it is dropped.
 */
export async function processPhoto(
  input: Buffer,
  kind: PhotoKind,
): Promise<Buffer> {
  let format: string | undefined;
  let pixels = 0;

  try {
    // Reads the header only, without the pixel limit, so an oversized picture
    // gets its own error instead of looking unreadable.
    const metadata = await sharp(input, { limitInputPixels: false }).metadata();

    format = metadata.format;
    pixels = (metadata.width ?? 0) * (metadata.height ?? 0);
  } catch {
    throw new BadRequestException(
      "Le fichier envoyé n'est pas une image lisible.",
    );
  }
  if (!format || !ACCEPTED_FORMATS.has(format))
    throw new UnsupportedMediaTypeException(
      'Format non pris en charge : envoyez une photo JPEG, PNG ou WebP (une photo HEIC doit être convertie en JPEG).',
    );
  if (pixels > MAX_INPUT_PIXELS)
    throw new PayloadTooLargeException(
      `Photo trop grande : ${MAX_INPUT_PIXELS / 1_000_000} mégapixels au maximum.`,
    );

  const { quality, ...resize } = OUTPUT[kind];

  try {
    return await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize(resize)
      .webp({ quality })
      .toBuffer();
  } catch {
    throw new BadRequestException(
      "Le fichier envoyé n'est pas une image lisible.",
    );
  }
}
