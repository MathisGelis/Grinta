import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validationExceptionFactory } from './common/validation/validation-errors';

/**
 * Swagger lists every route and its payloads: open in development, closed
 * in production unless SWAGGER_ENABLED=true is set on purpose.
 */
export function isSwaggerEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true'
  );
}

export const JSON_BODY_LIMIT = '100kb';

/**
 * HTTP settings every request goes through: proxy, compression, validation
 * and the error format. Shared by main.ts and the e2e tests, so the tests
 * exercise the API exactly as it runs in production.
 */
export function configureApp(app: NestExpressApplication) {
  // Behind nginx every request reaches Node from 127.0.0.1. Trusting the
  // proxy hop makes req.ip the real client address, which is what the
  // throttler keys on. Without it all users would share a single rate-limit
  // bucket, so five failed logins anywhere would lock everyone out.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
  app.disable('x-powered-by');
  // JSON compresses five to ten times (the exercise catalogue goes from about
  // 100 KB to about 15 KB), which is mobile data and server bandwidth saved on
  // every response above 1 KB. Brotli when the client accepts it, else gzip.
  // Photos are already compressed and are left alone.
  app.use(compression());
  // Security headers (nosniff, HSTS, frame and referrer rules...). The API
  // serves JSON, so the default Content-Security-Policy fits, except for the
  // Swagger page, which loads inline scripts: it is left off while Swagger
  // is served. nginx may add the same headers; helmet makes them hold even
  // without it.
  app.use(
    helmet({ contentSecurityPolicy: isSwaggerEnabled() ? false : undefined }),
  );

  // Explicit body limits: a JSON body is 100 KB at most (the longest text,
  // an import, is a few KB). Photos travel as multipart and have their own
  // 2 MB limit in the upload interceptor. Past the limit the filter answers
  // 413 PAYLOAD_TOO_LARGE.
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: true });

  // The only ValidationPipe. Unknown properties in a body or query are
  // rejected with a 400 rather than silently stripped, so a client typo
  // surfaces instead of being ignored. Failures come back as
  // { statusCode, code: 'VALIDATION_ERROR', message, errors: [{ field, code,
  // message }] }, see common/validation/validation-errors.ts. The target is
  // kept on each error to find the decorator behind it; values are left out.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: true, value: false },
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
