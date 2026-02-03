import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Exercise } from 'src/exercise/entities/exercise.entity';
import { User } from 'src/users/entities/users.entity';
import { Repository } from 'typeorm';
import { CreateWorkoutCompletedDto } from './dto/create-workout-completed.entity';
import { CreateWorkoutPlannedDto } from './dto/create-workout-planned.dto';
import { WorkoutCompleted } from './entities/workout-completed.entity';
import { WorkoutPlanned } from './entities/workout-planned.entity';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectRepository(WorkoutPlanned)
    private readonly plannedRepo: Repository<WorkoutPlanned>,

    @InjectRepository(WorkoutCompleted)
    private readonly completedRepo: Repository<WorkoutCompleted>,

    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
  ) {}

  async createPlanned(user: User, dto: CreateWorkoutPlannedDto) {
    const workout = this.plannedRepo.create({
      user,
      title: dto.title,
      description: dto.description,
      exercises: await Promise.all(
        dto.exercises.map(async (e) => ({
          exercise: await this.exerciseRepo.findOneByOrFail({ id: e.exerciseId }),
          rest_seconds: e.rest_seconds,
          planned_sets: e.planned_sets,
        })),
      ),
    });

    return this.plannedRepo.save(workout);
  }

  async createCompleted(user: User, dto: CreateWorkoutCompletedDto) {
    const workout = this.completedRepo.create({
      user,
      title: dto.title,
      completedAt: new Date(),
      total_duration_seconds: dto.total_duration_seconds,
      description: dto.description,
      exercises: await Promise.all(
        dto.exercises.map(async (e) => ({
          exercise: await this.exerciseRepo.findOneByOrFail({ id: e.exerciseId }),
          sets: e.sets,
        })),
      ),
    });

    return this.completedRepo.save(workout);
  }
}
