import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { readPhotoStorageConfig, UPLOADS_ROUTE } from './photos/photos.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CONFIG
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

  // UPLOADED PHOTOS
  // Only when they are on the local disk (development): in production they
  // are in Supabase Storage and the app loads them from there. Public like
  // any image link: the names are random and never reused, so a photo can
  // only be fetched by someone the API gave its URL to, and it can be cached
  // for good. Only WebP files the server produced live there.
  const photos = readPhotoStorageConfig((key) =>
    app.get(ConfigService).get<string>(key),
  );

  if (photos.driver === 'local')
    app.useStaticAssets(photos.directory, {
      prefix: `${UPLOADS_ROUTE}/`,
      index: false,
      dotfiles: 'ignore',
      immutable: true,
      maxAge: '365d',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    });

  // SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Grinta API')
    .setDescription('User management API')
    .setVersion('0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT',
    )
    .addTag('users')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // RUN
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
