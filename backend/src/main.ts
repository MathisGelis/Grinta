import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CONFIG
  // Behind nginx every request reaches Node from 127.0.0.1. Trusting the
  // proxy hop makes req.ip the real client address, which is what the
  // throttler keys on. Without it all users would share a single rate-limit
  // bucket, so five failed logins anywhere would lock everyone out.
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
  app.disable('x-powered-by');

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
