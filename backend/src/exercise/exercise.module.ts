import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseController } from './exercise.controller';
import { Exercise } from './entities/exercise.entity';
import { ExerciseService } from './exercise.service';
import { UserExerciseStats } from './entities/user-exercise-stats.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, UserExerciseStats])],
  controllers: [ExerciseController],
  providers: [ExerciseService],
})
export class ExerciseModule {}
