import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { configureApp } from './app.setup';
import { findSchemaDrift } from './database/schema-drift';
import { readPhotoStorageConfig, UPLOADS_ROUTE } from './photos/photos.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApp(app);

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
  void reportSchemaDrift(app.get(DataSource));
}

/**
 * Logs, once the API serves, what the database lacks compared with the
 * entities: deploy.sh checks the schema before a restart, but a column can
 * also disappear between two deploys, and every query on it then fails with
 * a 500. Logged rather than fatal: an API that fails on one route is better
 * than none at all.
 */
async function reportSchemaDrift(dataSource: DataSource) {
  const logger = new Logger('SchemaCheck');

  try {
    const { missing } = await findSchemaDrift(dataSource);

    if (!missing.length) return;
    logger.error(
      `The database lacks ${missing.length} changes the code needs, queries using them will fail. Run npm run schema:check:prod for details`,
    );
    for (const query of missing) logger.error(query);
  } catch (error) {
    logger.warn(`Schema check skipped: ${(error as Error).message}`);
  }
}

void bootstrap();
