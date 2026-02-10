import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from 'src/exercise/entities/exercise.entity';
import { User } from 'src/users/entities/users.entity';
import { CreateCompletedWorkoutDto } from './dto/create-completed-workout.dto';
import { CreatePlannedWorkoutDto } from './dto/create-planned-workout.dto';
import { CompletedWorkout, CompletedWorkoutExercise } from './entities/completed-workout.entity';
import { PlannedWorkout, PlannedWorkoutExercise } from './entities/planned-workout.entity';
import { UpdatePlannedWorkoutDto } from './dto/update-planned.workout.dto';
import { UpdateCompletedWorkoutDto } from './dto/update-completed-workout.dto';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(PlannedWorkout)
    private plannedRepo: Repository<PlannedWorkout>,
    @InjectRepository(PlannedWorkoutExercise)
    private plannedExRepo: Repository<PlannedWorkoutExercise>,

    @InjectRepository(CompletedWorkout)
    private completedRepo: Repository<CompletedWorkout>,
    @InjectRepository(CompletedWorkoutExercise)
    private completedExRepo: Repository<CompletedWorkoutExercise>,

    @InjectRepository(Exercise)
    private exerciseRepo: Repository<Exercise>,
  ) {}

  async createPlannedWorkout(user: User, dto: CreatePlannedWorkoutDto) {
    const workout = this.plannedRepo.create({
      user: { id: user.id },
      title: dto.title,
      description: dto.description
    });

    workout.exercises = await Promise.all(
      dto.exercises.map(async (exDto) => {
        const exercise = await this.exerciseRepo.findOne({ where: { id: exDto.exerciseId } });

        if (!exercise)
          throw new NotFoundException(`Exercise ${exDto.exerciseId} not found`);
        return this.plannedExRepo.create({ exercise, sets: exDto.sets, plannedRestSeconds: exDto.plannedRestSeconds });
      }),
    );
    return this.plannedRepo.save(workout);
  }

  async createCompletedWorkout(user: User, dto: CreateCompletedWorkoutDto) {
    const workout = this.completedRepo.create({
      user: {id: user.id },
      title: dto.title,
      completionDate: new Date(dto.completionDate),
      totalDurationSeconds: dto.totalDurationSeconds,
      description: dto.description,
    });

    workout.exercises = await Promise.all(
      dto.exercises.map(async (exDto) => {
        const exercise = await this.exerciseRepo.findOne({ where: { id: exDto.exerciseId } });

        if (!exercise)
          throw new NotFoundException(`Exercise ${exDto.exerciseId} not found`);
        return this.completedExRepo.create({ exercise, sets: exDto.sets, timerSeconds: exDto.timerSeconds });
      }),
    );
    return this.completedRepo.save(workout);
  }

  async updatePlannedWorkout(user: any, workoutId: string, dto: UpdatePlannedWorkoutDto) {
    const workout = await this.plannedRepo.findOne({
      where: { id: workoutId, user: { id: user.userId } },
      relations: ['exercises', 'exercises.exercise'],
    });
    if (!workout)
      throw new NotFoundException('Planned workout not found');
    Object.assign(workout, {
      title: dto.title,
      description: dto.description,
    });

    if (dto.exercises) {
      await this.plannedExRepo.remove(workout.exercises);
      workout.exercises = await Promise.all(
        dto.exercises.map(async (exDto) => {
          const exercise = await this.exerciseRepo.findOne({ where: { id: exDto.exerciseId } });

          if (!exercise)
            throw new NotFoundException(`Exercise ${exDto.exerciseId} not found`);
          return this.plannedExRepo.create({
            exercise,
            sets: exDto.sets,
            plannedRestSeconds: exDto.plannedRestSeconds,
          });
        }),
      );
    }
    return this.plannedRepo.save(workout);
  }

  async updateCompletedWorkout(user: any, workoutId: string, dto: UpdateCompletedWorkoutDto) {
    const workout = await this.completedRepo.findOne({
      where: { id: workoutId, user: { id: user.userId } },
      relations: ['exercises', 'exercises.exercise'],
    });

    if (!workout)
      throw new NotFoundException('Completed workout not found');
    Object.assign(workout, {
      title: dto.title,
      description: dto.description,
      completionDate: dto.completionDate ? new Date(dto.completionDate) : workout.completionDate,
      totalDurationSeconds: dto.totalDurationSeconds ?? workout.totalDurationSeconds,
    });

    if (dto.exercises) {
      await this.completedExRepo.remove(workout.exercises);
      workout.exercises = await Promise.all(
        dto.exercises.map(async (exDto) => {
          const exercise = await this.exerciseRepo.findOne({ where: { id: exDto.exerciseId } });

          if (!exercise)
            throw new NotFoundException(`Exercise ${exDto.exerciseId} not found`);
          return this.completedExRepo.create({
            exercise,
            sets: exDto.sets,
            timerSeconds: exDto.timerSeconds,
          });
        }),
      );
    }
    return this.completedRepo.save(workout);
  }

  async getPlannedWorkouts(user: any) {
    const workouts = await this.plannedRepo.find({
      where: { user: { id: user.userId } },
      relations: ['exercises'],
      order: { createdAt: 'DESC' },
    });

    return workouts.map(w => ({
      id: w.id,
      title: w.title,
      description: w.description,
      totalExercises: w.exercises.length,
    }));
  }

  async getCompletedWorkouts(user: any) {
    const workouts = await this.completedRepo.find({
      where: { user: { id: user.userId } },
      relations: ['exercises'],
      order: { completionDate: 'DESC' },
    });

    return workouts.map(w => ({
      id: w.id,
      title: w.title,
      description: w.description,
      completionDate: w.completionDate,
      totalDurationSeconds: w.totalDurationSeconds,
      totalExercises: w.exercises.length,
    }));
  }

  async getPlannedWorkoutById(user: any, workoutId: string) {
    const workout = await this.plannedRepo.findOne({
      where: { id: workoutId, user: { id: user.userId } },
      relations: ['exercises'],
    });

    if (!workout)
      throw new NotFoundException('Planned workout not found');
    return {
      workout,
      totalExercises: workout.exercises.length,
    };
  }

  async getCompletedWorkoutById(user: any, workoutId: string) {
    const workout = await this.completedRepo.findOne({
      where: { id: workoutId, user: { id: user.userId } },
      relations: ['exercises'],
    });

    if (!workout)
      throw new NotFoundException('Completed workout not found');
    return {
      workout,
      totalExercises: workout.exercises.length,
    };
  }
}
