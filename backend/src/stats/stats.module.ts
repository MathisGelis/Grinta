import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompletedWorkout } from '../workouts/entities/completed-workout.entity';
import { PlannedWorkout } from '../workouts/entities/planned-workout.entity';
import { User } from '../users/entities/users.entity';
import { StatsCalculatorService } from './stats-calculator.service';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompletedWorkout, PlannedWorkout, User])],
  controllers: [StatsController],
  providers: [StatsService, StatsCalculatorService],
  exports: [StatsService],
})
export class StatsModule {}
