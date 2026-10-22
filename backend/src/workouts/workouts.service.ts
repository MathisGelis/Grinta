import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Exercise } from 'src/exercise/entities/exercise.entity';
import { AuthUser } from 'src/auth/auth-user.interface';
import { ExerciseStatsService } from 'src/exercise/exercise-stats.service';
import { BadgesService } from 'src/badges/badges.service';
import { BadgeDto } from 'src/badges/dto/badge.dto';
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
import { PhotosService } from 'src/photos/photos.service';

type WorkoutPhotoUrls<T = string> = { photoUrl: T; photoThumbnailUrl: T };

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(PlannedWorkout)
    private plannedRepo: Repository<PlannedWorkout>,
    @InjectRepository(PlannedWorkoutExercise)
    private plannedExRepo: Repository<PlannedWorkoutExercise>,

    @InjectRepository(CompletedWorkout)
    private completedRepo: Repository<CompletedWorkout>,

    @InjectRepository(Exercise)
    private exerciseRepo: Repository<Exercise>,

    private readonly dataSource: DataSource,
    private readonly exerciseStats: ExerciseStatsService,
    private readonly badges: BadgesService,
    private readonly photos: PhotosService,
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

  /**
   * Saves the session, then in the same transaction refreshes the user's stats
   * for every exercise it contains and awards the personal record badges it
   * earned, returned under `badges`. If any step fails nothing is saved.
   */
  async createCompletedWorkout(user: AuthUser, dto: CreateCompletedWorkoutDto) {
    const byId = await this.resolveExercises(
      dto.exercises.map((exDto) => exDto.exerciseId),
    );

    return this.dataSource.transaction(async (manager) => {
      const workout = manager.create(CompletedWorkout, {
        user: { id: user.id },
        title: dto.title,
        completionDate: new Date(dto.completionDate),
        totalDurationSeconds: dto.totalDurationSeconds,
        description: dto.description,
      });

      workout.exercises = dto.exercises.map((exDto) =>
        manager.create(CompletedWorkoutExercise, {
          exercise: byId.get(exDto.exerciseId),
          sets: exDto.sets,
          timerSeconds: exDto.timerSeconds,
        }),
      );
      const saved = await manager.save(workout);
      const badges = await this.syncProgress(
        manager,
        user.id,
        saved,
        [...byId.keys()],
        { replaceExisting: false },
      );

      return Object.assign(saved, { badges });
    });
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

  /**
   * Stats are recomputed for the exercises before and after the edit, and the
   * badges of this workout are re-evaluated: fixing a mistyped weight removes
   * the record it had wrongly set.
   */
  async updateCompletedWorkout(
    user: AuthUser,
    workoutId: string,
    dto: UpdateCompletedWorkoutDto,
  ) {
    const { exercises, completionDate, ...scalarFields } = dto;
    const byId = exercises
      ? await this.resolveExercises(exercises.map((exDto) => exDto.exerciseId))
      : null;

    return this.dataSource.transaction(async (manager) => {
      const workout = await manager.findOne(CompletedWorkout, {
        where: { id: workoutId, user: { id: user.id } },
        relations: ['exercises', 'exercises.exercise'],
      });

      if (!workout) throw new NotFoundException('Completed workout not found');
      const previousExerciseIds = workout.exercises.map((e) => e.exercise.id);

      Object.assign(workout, omitUndefined(scalarFields));
      if (completionDate) workout.completionDate = new Date(completionDate);

      if (exercises && byId) {
        await manager.remove(workout.exercises);
        workout.exercises = exercises.map((exDto) =>
          manager.create(CompletedWorkoutExercise, {
            exercise: byId.get(exDto.exerciseId),
            sets: exDto.sets,
            timerSeconds: exDto.timerSeconds,
          }),
        );
      }
      const saved = await manager.save(workout);
      const badges = await this.syncProgress(
        manager,
        user.id,
        saved,
        [...previousExerciseIds, ...saved.exercises.map((e) => e.exercise.id)],
        { replaceExisting: true },
      );

      return Object.assign(saved, { badges });
    });
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
        'w."photoUrl" AS "photoUrl"',
        'w."photoThumbnailUrl" AS "photoThumbnailUrl"',
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

  /**
   * The workout's badges go with it (ON DELETE CASCADE) and the stats of its
   * exercises are rebuilt from the remaining sessions. Its photo is deleted
   * once the transaction has committed.
   */
  async deleteCompletedWorkout(user: AuthUser, workoutId: string) {
    const photos = await this.dataSource.transaction(async (manager) => {
      const workout = await manager.findOne(CompletedWorkout, {
        where: { id: workoutId, user: { id: user.id } },
        relations: ['exercises'],
      });

      if (!workout) throw new NotFoundException('Completed workout not found');
      await manager.delete(CompletedWorkout, { id: workout.id });
      await this.exerciseStats.recompute(
        manager,
        user.id,
        workout.exercises.map((e) => e.exercise.id),
      );
      return [workout.photoUrl, workout.photoThumbnailUrl];
    });

    await this.photos.removeAll(photos);
    return { message: 'Completed workout deleted successfully' };
  }

  /**
   * Replaces the photo of a completed workout of the user. Ownership is
   * checked before the upload is processed, so a request on someone else's
   * workout costs no image work, and again under the row lock that swaps the
   * URLs. The previous files are deleted only once nothing points to them.
   */
  async setCompletedWorkoutPhoto(
    user: AuthUser,
    workoutId: string,
    file: Express.Multer.File | undefined,
  ): Promise<WorkoutPhotoUrls> {
    const owned = await this.completedRepo.exists({
      where: { id: workoutId, user: { id: user.id } },
    });

    if (!owned) throw new NotFoundException('Completed workout not found');
    const urls = await this.photos.uploadWithThumbnail(file);
    let previous: string[];

    try {
      previous = await this.swapCompletedWorkoutPhoto(user, workoutId, urls);
    } catch (error) {
      await this.photos.removeAll(Object.values(urls));
      throw error;
    }
    await this.photos.removeAll(previous);
    return urls;
  }

  async removeCompletedWorkoutPhoto(
    user: AuthUser,
    workoutId: string,
  ): Promise<WorkoutPhotoUrls<null>> {
    const urls = { photoUrl: null, photoThumbnailUrl: null };

    await this.photos.removeAll(
      await this.swapCompletedWorkoutPhoto(user, workoutId, urls),
    );
    return urls;
  }

  // Sets the photo under a row lock and returns the URLs it replaced, so two
  // concurrent uploads each get different previous files to delete.
  private swapCompletedWorkoutPhoto(
    user: AuthUser,
    workoutId: string,
    urls: WorkoutPhotoUrls<string | null>,
  ): Promise<string[]> {
    return this.dataSource.transaction(async (manager) => {
      const workout = await manager
        .createQueryBuilder(CompletedWorkout, 'w')
        .setLock('pessimistic_write')
        .where('w.id = :workoutId AND w."userId" = :userId', {
          workoutId,
          userId: user.id,
        })
        .getOne();

      if (!workout) throw new NotFoundException('Completed workout not found');
      await manager.update(CompletedWorkout, workout.id, urls);
      return [workout.photoUrl, workout.photoThumbnailUrl].filter(
        (url): url is string => !!url,
      );
    });
  }

  private async syncProgress(
    manager: EntityManager,
    userId: string,
    workout: CompletedWorkout,
    exerciseIds: string[],
    options: { replaceExisting: boolean },
  ): Promise<BadgeDto[]> {
    const histories = await this.exerciseStats.recompute(
      manager,
      userId,
      exerciseIds,
    );

    return this.badges.awardForWorkout(
      manager,
      userId,
      workout,
      histories,
      options,
    );
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
