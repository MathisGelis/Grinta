import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import {
  PlannedWorkout,
  PlannedWorkoutExercise,
} from './entities/planned-workout.entity';
import {
  CompletedWorkout,
  CompletedWorkoutExercise,
} from './entities/completed-workout.entity';
import { Exercise } from '../exercise/entities/exercise.entity';
import { ExerciseModule } from '../exercise/exercise.module';
import { BadgesModule } from '../badges/badges.module';
import { PhotosModule } from '../photos/photos.module';
import { PostsModule } from '../posts/posts.module';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlannedWorkout,
      PlannedWorkoutExercise,
      CompletedWorkout,
      CompletedWorkoutExercise,
      Exercise,
    ]),
    ExerciseModule,
    BadgesModule,
    PhotosModule,
    PostsModule,
    StatsModule,
  ],
  providers: [WorkoutService],
  controllers: [WorkoutsController],
})
export class WorkoutsModule {}
