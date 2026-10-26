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
        // Safety net for the schema: deploy.sh already applies pending
        // migrations before the restart, so this is normally a no-op. It
        // matters when the API starts on code whose migrations did not run,
        // which is the case of the first deploy with this setting: deploy.sh
        // pulls itself, and bash keeps executing the version it started
        // with. Only in the API, never in the CLI data source, where it would
        // apply migrations on `migration:generate`. One process only: TypeORM
        // does not lock the migrations table against PM2 cluster instances.
        migrationsRun:
          configService.get<string>('DB_MIGRATIONS_RUN', 'true') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
