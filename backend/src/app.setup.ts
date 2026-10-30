import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

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

  // Unknown properties in a body or query are rejected with a 400 rather than
  // silently stripped, so a client typo surfaces instead of being ignored.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
