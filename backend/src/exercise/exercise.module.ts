import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseController } from './exercise.controller';
import { Exercise } from './entities/exercise.entity';
import { ExerciseService } from './exercise.service';
import { UserExerciseStats } from './entities/user-exercise-stats.entity';
import { ExerciseStatsService } from './exercise-stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, UserExerciseStats])],
  controllers: [ExerciseController],
  providers: [ExerciseService, ExerciseStatsService],
  exports: [ExerciseStatsService],
})
export class ExerciseModule {}
