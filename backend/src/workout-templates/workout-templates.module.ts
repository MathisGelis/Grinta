import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from '../exercise/entities/exercise.entity';
import { User } from '../users/entities/users.entity';
import { WorkoutTemplatesController } from './workout-templates.controller';
import { WorkoutTemplatesService } from './workout-templates.service';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, User])],
  controllers: [WorkoutTemplatesController],
  providers: [WorkoutTemplatesService],
})
export class WorkoutTemplatesModule {}
