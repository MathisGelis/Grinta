import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from '../exercise/entities/exercise.entity';
import { ExerciseModule } from '../exercise/exercise.module';
import { WorkoutImportController } from './workout-import.controller';
import { WorkoutImportService } from './workout-import.service';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise]), ExerciseModule],
  controllers: [WorkoutImportController],
  providers: [WorkoutImportService],
})
export class WorkoutImportModule {}
