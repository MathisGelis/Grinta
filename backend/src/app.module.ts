import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ExerciseModule } from './exercise/exercise.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { ProgrammesModule } from './programmes/programmes.module';
import { ConnectionsModule } from './connections/connections.module';
import { PostsModule } from './posts/posts.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ExerciseModule,
    WorkoutsModule,
    ProgrammesModule,
    ConnectionsModule,
    PostsModule,
    StatsModule,
  ],
})
export class AppModule {}
