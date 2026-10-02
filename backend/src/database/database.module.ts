import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { buildDatabaseOptions } from './database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...buildDatabaseOptions((key, fallback) =>
          configService.get<string>(key, fallback as string),
        ),
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
