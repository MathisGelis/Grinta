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
  ],
  providers: [WorkoutService],
  controllers: [WorkoutsController],
})
export class WorkoutsModule {}
