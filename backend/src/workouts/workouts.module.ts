import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from '../exercise/entities/exercise.entity';
import { WorkoutCompletedExercise } from './entities/workout-completed-exercise.entity';
import { WorkoutCompletedSet } from './entities/workout-completed-set.entity';
import { WorkoutCompleted } from './entities/workout-completed.entity';
import { WorkoutPlannedExercise } from './entities/workout-planned-exercise.entity';
import { WorkoutPlanned } from './entities/workout-planned.entity';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    WorkoutPlanned,
    WorkoutCompleted,
    WorkoutCompletedExercise,
    WorkoutCompletedSet,
    WorkoutPlannedExercise,
    Exercise
  ])],
  controllers: [WorkoutsController],
  providers: [WorkoutsService]
})
export class WorkoutsModule {}
