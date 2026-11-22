import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { from, Observable, switchMap } from 'rxjs';
import { ExerciseTranslationService } from './exercise-translation.service';
import { pickLocale } from './locale';

/**
 * Serves exercise names, descriptions and instructions in the language of
 * the Accept-Language header, on every route. English, or a language without
 * translations, leaves the response untouched. `Vary: Accept-Language` keeps
 * caches (and the catalogue ETag) apart per language.
 */
@Injectable()
export class ExerciseLocaleInterceptor implements NestInterceptor {
  constructor(private readonly translator: ExerciseTranslationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const locale = pickLocale(request.headers['accept-language']);

    response.vary('Accept-Language');
    if (locale === 'en') return next.handle();
    return next
      .handle()
      .pipe(switchMap((body) => from(this.translator.localize(body, locale))));
  }
}
