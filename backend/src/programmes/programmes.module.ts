import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannedWorkout } from 'src/workouts/entities/planned-workout.entity';
import { ProgrammeDay } from './entities/programme-day.entity';
import { Programme } from './entities/programme.entity';
import { ProgrammesController } from './programmes.controller';
import { ProgrammesService } from './programmes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Programme,
      ProgrammeDay,
      PlannedWorkout,
    ]),
  ],
  controllers: [ProgrammesController],
  providers: [ProgrammesService]
})
export class ProgrammesModule {}
