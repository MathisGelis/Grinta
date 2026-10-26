import {
  applyDecorators,
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';

export const PHOTO_FIELD = 'photo';
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const MulterPhotoInterceptor = FileInterceptor(PHOTO_FIELD, {
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 0 },
});

/**
 * Reads the single photo of a multipart request into memory, capped at
 * MAX_UPLOAD_BYTES, and rewords multer's errors for the app.
 */
@Injectable()
class PhotoUploadInterceptor implements NestInterceptor {
  private readonly multer = new MulterPhotoInterceptor();

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    try {
      return await this.multer.intercept(context, next);
    } catch (error) {
      if (error instanceof PayloadTooLargeException)
        throw new PayloadTooLargeException(
          `Photo trop lourde : ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo au maximum.`,
        );
      if (error instanceof BadRequestException)
        throw new BadRequestException(
          'Envoyez une seule photo, dans le champ « photo » du formulaire multipart.',
        );
      throw error;
    }
  }
}

/**
 * A route that receives one photo as multipart/form-data in the `photo` field.
 * Decoding and re-encoding a photo costs far more than a JSON request, hence
 * the tighter rate limit.
 */
export function PhotoUpload() {
  return applyDecorators(
    Throttle({ default: { limit: 10, ttl: 60_000 } }),
    UseInterceptors(PhotoUploadInterceptor),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: [PHOTO_FIELD],
        properties: {
          [PHOTO_FIELD]: {
            type: 'string',
            format: 'binary',
            description: `JPEG, PNG or WebP, ${MAX_UPLOAD_BYTES / 1024 / 1024} MB at most`,
          },
        },
      },
    }),
  );
}
