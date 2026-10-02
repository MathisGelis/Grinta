import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Exercise } from 'src/exercise/entities/exercise.entity';
import { AuthUser } from 'src/auth/auth-user.interface';
import { CreateCompletedWorkoutDto } from './dto/create-completed-workout.dto';
import { CreatePlannedWorkoutDto } from './dto/create-planned-workout.dto';
import {
  CompletedWorkout,
  CompletedWorkoutExercise,
} from './entities/completed-workout.entity';
import {
  PlannedWorkout,
  PlannedWorkoutExercise,
} from './entities/planned-workout.entity';
import { UpdatePlannedWorkoutDto } from './dto/update-planned.workout.dto';
import { UpdateCompletedWorkoutDto } from './dto/update-completed-workout.dto';
import { omitUndefined } from 'src/common/utils/omit-undefined';

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

  async createPlannedWorkout(user: AuthUser, dto: CreatePlannedWorkoutDto) {
    const workout = this.plannedRepo.create({
      user: { id: user.id },
      title: dto.title,
      description: dto.description,
    });

    const byId = await this.resolveExercises(
      dto.exercises.map((exDto) => exDto.exerciseId),
    );

    workout.exercises = dto.exercises.map((exDto) =>
      this.plannedExRepo.create({
        exercise: byId.get(exDto.exerciseId),
        sets: exDto.sets,
        plannedRestSeconds: exDto.plannedRestSeconds,
      }),
    );
    return this.plannedRepo.save(workout);
  }

  async createCompletedWorkout(user: AuthUser, dto: CreateCompletedWorkoutDto) {
    const workout = this.completedRepo.create({
      user: { id: user.id },
      title: dto.title,
      completionDate: new Date(dto.completionDate),
      totalDurationSeconds: dto.totalDurationSeconds,
      description: dto.description,
    });

    const byId = await this.resolveExercises(
      dto.exercises.map((exDto) => exDto.exerciseId),
    );

    workout.exercises = dto.exercises.map((exDto) =>
      this.completedExRepo.create({
        exercise: byId.get(exDto.exerciseId),
        sets: exDto.sets,
        timerSeconds: exDto.timerSeconds,
      }),
    );
    return this.completedRepo.save(workout);
  }

  async updatePlannedWorkout(
    user: AuthUser,
    workoutId: string,
    dto: UpdatePlannedWorkoutDto,
  ) {
    const workout = await this.plannedRepo.findOne({
      where: { id: workoutId, user: { id: user.id } },
      relations: ['exercises', 'exercises.exercise'],
    });
    if (!workout) throw new NotFoundException('Planned workout not found');

    const { exercises, ...scalarFields } = dto;

    Object.assign(workout, omitUndefined(scalarFields));

    if (exercises) {
      const byId = await this.resolveExercises(
        exercises.map((exDto) => exDto.exerciseId),
      );

      await this.plannedExRepo.remove(workout.exercises);
      workout.exercises = exercises.map((exDto) =>
        this.plannedExRepo.create({
          exercise: byId.get(exDto.exerciseId),
          sets: exDto.sets,
          plannedRestSeconds: exDto.plannedRestSeconds,
        }),
      );
    }
    return this.plannedRepo.save(workout);
  }

  async updateCompletedWorkout(
    user: AuthUser,
    workoutId: string,
    dto: UpdateCompletedWorkoutDto,
  ) {
    const workout = await this.completedRepo.findOne({
      where: { id: workoutId, user: { id: user.id } },
      relations: ['exercises', 'exercises.exercise'],
    });

    if (!workout) throw new NotFoundException('Completed workout not found');

    const { exercises, completionDate, ...scalarFields } = dto;

    Object.assign(workout, omitUndefined(scalarFields));
    if (completionDate) workout.completionDate = new Date(completionDate);

    if (exercises) {
      const byId = await this.resolveExercises(
        exercises.map((exDto) => exDto.exerciseId),
      );

      await this.completedExRepo.remove(workout.exercises);
      workout.exercises = exercises.map((exDto) =>
        this.completedExRepo.create({
          exercise: byId.get(exDto.exerciseId),
          sets: exDto.sets,
          timerSeconds: exDto.timerSeconds,
        }),
      );
    }
    return this.completedRepo.save(workout);
  }

  // The list screens only need the number of exercises, so it is counted in
  // SQL. Loading every exercise row (with its eager Exercise join and the sets
  // JSON) just to read `.length` made this the heaviest read for active users.
  async getPlannedWorkouts(user: AuthUser) {
    return this.plannedRepo
      .createQueryBuilder('w')
      .select([
        'w.id AS id',
        'w.title AS title',
        'w.description AS description',
      ])
      .addSelect(
        '(SELECT COUNT(*)::int FROM planned_workout_exercises e WHERE e."workoutId" = w.id)',
        'totalExercises',
      )
      .where('w."userId" = :userId', { userId: user.id })
      .orderBy('w."createdAt"', 'DESC')
      .addOrderBy('w.id', 'DESC')
      .getRawMany();
  }

  async getCompletedWorkouts(user: AuthUser) {
    return this.completedRepo
      .createQueryBuilder('w')
      .select([
        'w.id AS id',
        'w.title AS title',
        'w.description AS description',
        'w."completionDate" AS "completionDate"',
        'w."totalDurationSeconds" AS "totalDurationSeconds"',
      ])
      .addSelect(
        '(SELECT COUNT(*)::int FROM completed_workout_exercises e WHERE e."workoutId" = w.id)',
        'totalExercises',
      )
      .where('w."userId" = :userId', { userId: user.id })
      .orderBy('w."completionDate"', 'DESC')
      .addOrderBy('w."createdAt"', 'DESC')
      .addOrderBy('w.id', 'DESC')
      .getRawMany();
  }

  async getPlannedWorkoutById(workoutId: string) {
    const workout = await this.plannedRepo.findOne({
      where: { id: workoutId },
      relations: ['exercises'],
    });

    if (!workout) throw new NotFoundException('Planned workout not found');
    return {
      workout,
      totalExercises: workout.exercises.length,
    };
  }

  async getCompletedWorkoutById(workoutId: string) {
    const workout = await this.completedRepo.findOne({
      where: { id: workoutId },
      relations: ['exercises'],
    });

    if (!workout) throw new NotFoundException('Completed workout not found');
    return {
      workout,
      totalExercises: workout.exercises.length,
    };
  }

  async deletePlannedWorkout(user: AuthUser, workoutId: string) {
    const workout = await this.plannedRepo.findOne({
      where: { id: workoutId, user: { id: user.id } },
    });

    if (!workout) throw new NotFoundException('Planned workout not found');
    await this.plannedRepo.remove(workout);
    return { message: 'Planned workout deleted successfully' };
  }

  async deleteCompletedWorkout(user: AuthUser, workoutId: string) {
    const workout = await this.completedRepo.findOne({
      where: { id: workoutId, user: { id: user.id } },
    });

    if (!workout) throw new NotFoundException('Completed workout not found');
    await this.completedRepo.remove(workout);
    return { message: 'Completed workout deleted successfully' };
  }

  /**
   * Loads every exercise referenced by a payload in one query instead of one
   * query per exercise, and fails with the first unknown id in payload order.
   */
  private async resolveExercises(
    exerciseIds: string[],
  ): Promise<Map<string, Exercise>> {
    const unique = [...new Set(exerciseIds)];
    const found = await this.exerciseRepo.find({ where: { id: In(unique) } });
    const byId = new Map(found.map((exercise) => [exercise.id, exercise]));
    const missing = unique.find((id) => !byId.has(id));

    if (missing) throw new NotFoundException(`Exercise ${missing} not found`);
    return byId;
  }
}
