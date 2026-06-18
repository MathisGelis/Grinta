import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { ConnectionsModule } from 'src/connections/connections.module';
import { Connection } from 'src/connections/entities/connections.entity';
import { CompletedWorkout } from 'src/workouts/entities/completed-workout.entity';
import { Post } from 'src/posts/entities/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Connection, CompletedWorkout, Post]),
    ConnectionsModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
