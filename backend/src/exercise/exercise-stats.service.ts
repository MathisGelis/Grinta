import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SetPair } from '../workouts/entities/completed-workout.entity';
import { ExerciseStatsDto } from './dto/exercise-stats.dto';
import { Exercise } from './entities/exercise.entity';
import { UserExerciseStats } from './entities/user-exercise-stats.entity';
import {
  buildExerciseStats,
  ExerciseSession,
  ExerciseStatsSnapshot,
} from './utils/exercise-history.util';

/** Every session of one exercise for one user. */
export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  sessions: ExerciseSession[];
}

@Injectable()
export class ExerciseStatsService {
  constructor(
    @InjectRepository(UserExerciseStats)
    private readonly statsRepository: Repository<UserExerciseStats>,
  ) {}

  /**
   * Rebuilds the stats of these exercises from the user's whole history and
   * returns that history so the caller can reuse it (badges). Recomputing
   * rather than adding to the stored totals keeps the stats right after a
   * workout is edited or deleted. Meant to run inside the transaction that
   * changed the workout.
   */
  async recompute(
    manager: EntityManager,
    userId: string,
    exerciseIds: string[],
  ): Promise<Map<string, ExerciseHistory>> {
    const ids = [...new Set(exerciseIds)];

    if (!ids.length) return new Map();
    const histories = await this.loadHistories(manager, userId, ids);
    const snapshots = ids.map((id) => ({
      id,
      snapshot: buildExerciseStats(histories.get(id)?.sessions ?? []),
    }));
    const upserts = snapshots.filter(
      (s): s is { id: string; snapshot: ExerciseStatsSnapshot } =>
        s.snapshot !== null,
    );
    const vanished = snapshots.filter((s) => !s.snapshot).map((s) => s.id);

    // One statement for every exercise, keyed on the (user, exercise) unique
    // constraint, instead of a read then a write per exercise.
    if (upserts.length)
      await manager
        .createQueryBuilder()
        .insert()
        .into(UserExerciseStats)
        .values(
          upserts.map(({ id, snapshot }) => ({
            user: { id: userId },
            exercise: { id },
            ...toColumns(snapshot),
          })),
        )
        .orUpdate(
          [
            'PR',
            'pr_reps',
            'best_estimated_1rm',
            'best_session_volume',
            'max_reps',
            'last_reps',
            'last_weight',
            'last_sets',
            'last_performed_at',
            'total_sessions',
            'total_sets',
            'total_reps',
            'total_volume',
            'updatedAt',
          ],
          ['user_id', 'exercise_id'],
        )
        .execute();
    if (vanished.length)
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserExerciseStats)
        .where('user_id = :userId AND exercise_id IN (:...vanished)', {
          userId,
          vanished,
        })
        .execute();
    return histories;
  }

  async getForUser(
    userId: string,
    exerciseId: string,
  ): Promise<ExerciseStatsDto> {
    // A query builder rather than findOne: findOne with a relation issues an
    // extra paginating query, one more round trip for a single row.
    const row = await this.statsRepository
      .createQueryBuilder('stats')
      .innerJoinAndSelect('stats.exercise', 'exercise')
      .where('stats.user_id = :userId AND stats.exercise_id = :exerciseId', {
        userId,
        exerciseId,
      })
      .getOne();

    if (!row)
      throw new NotFoundException(
        'Aucune statistique pour cet exercice : terminez une séance qui le contient.',
      );
    return toDto(row);
  }

  async listForUser(userId: string): Promise<ExerciseStatsDto[]> {
    const rows = await this.statsRepository.find({
      where: { user: { id: userId } },
      relations: ['exercise'],
      order: { last_performed_at: { direction: 'DESC', nulls: 'LAST' } },
    });

    return rows.map(toDto);
  }

  private async loadHistories(
    manager: EntityManager,
    userId: string,
    exerciseIds: string[],
  ): Promise<Map<string, ExerciseHistory>> {
    const rows: Array<{
      exerciseId: string;
      exerciseName: string;
      workoutId: string;
      completedAt: Date;
      createdAt: Date;
      sets: SetPair[] | null;
    }> = await manager.query(
      `SELECT e."exerciseId" AS "exerciseId", ex.name AS "exerciseName",
              w.id AS "workoutId", w."completionDate" AS "completedAt",
              w."createdAt" AS "createdAt", e.sets AS sets
         FROM completed_workouts w
         JOIN completed_workout_exercises e ON e."workoutId" = w.id
         JOIN exercises ex ON ex.id = e."exerciseId"
        WHERE w."userId" = $1
          AND e."exerciseId" = ANY($2::uuid[])`,
      [userId, exerciseIds],
    );
    const histories = new Map<string, ExerciseHistory>();

    for (const row of rows) {
      const history = histories.get(row.exerciseId) ?? {
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        sessions: [],
      };
      // An exercise listed twice in one workout is one session.
      const session = history.sessions.find(
        (s) => s.workoutId === row.workoutId,
      );

      if (session) session.sets.push(...(row.sets ?? []));
      else
        history.sessions.push({
          workoutId: row.workoutId,
          completedAt: row.completedAt,
          createdAt: row.createdAt,
          sets: [...(row.sets ?? [])],
        });
      histories.set(row.exerciseId, history);
    }
    return histories;
  }
}

function toColumns(snapshot: ExerciseStatsSnapshot) {
  return {
    PR: snapshot.prWeight,
    pr_reps: snapshot.prReps,
    best_estimated_1rm: snapshot.bestEstimatedOneRepMax,
    best_session_volume: snapshot.bestSessionVolume,
    max_reps: snapshot.maxReps,
    last_reps: snapshot.lastReps,
    last_weight: snapshot.lastWeight,
    last_sets: snapshot.lastSets,
    last_performed_at: snapshot.lastPerformedAt,
    total_sessions: snapshot.totalSessions,
    total_sets: snapshot.totalSets,
    total_reps: snapshot.totalReps,
    total_volume: snapshot.totalVolume,
    updatedAt: new Date(),
  };
}

function toDto(
  row: UserExerciseStats & { exercise: Exercise },
): ExerciseStatsDto {
  return {
    exerciseId: row.exercise.id,
    exerciseName: row.exercise.name,
    primaryMuscle: row.exercise.primary_muscle,
    lastPerformedAt: row.last_performed_at ?? null,
    lastWeight: row.last_weight ?? null,
    lastReps: row.last_reps ?? null,
    lastSets: row.last_sets ?? [],
    prWeight: row.PR ?? null,
    prReps: row.pr_reps ?? null,
    bestEstimatedOneRepMax: row.best_estimated_1rm ?? null,
    bestSessionVolume: row.best_session_volume ?? null,
    maxReps: row.max_reps ?? null,
    totalSessions: row.total_sessions,
    totalSets: row.total_sets,
    totalReps: row.total_reps,
    totalVolume: row.total_volume,
    updatedAt: row.updatedAt,
  };
}
