import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SetPair } from '../workouts/entities/completed-workout.entity';
import { ExerciseStatsDto } from './dto/exercise-stats.dto';
import {
  ComparedExerciseStatsDto,
  ExerciseComparisonDto,
} from './dto/exercise-comparison.dto';
import { Exercise } from './entities/exercise.entity';
import { UserExerciseStats } from './entities/user-exercise-stats.entity';
import {
  detectPersonalRecords,
  PersonalRecord,
  previousBestsOf,
  recordsAgainst,
} from '../badges/utils/personal-records.util';
import {
  addSession,
  buildExerciseStats,
  ExerciseSession,
  StoredExerciseStats,
  summarizeSession,
} from './utils/exercise-history.util';

/** Every session of one exercise for one user. */
export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  sessions: ExerciseSession[];
}

/** Records one workout set on one exercise. */
export interface ExerciseRecords {
  exerciseId: string;
  exerciseName: string;
  records: PersonalRecord[];
}

type StatsRow = {
  exercise_id: string;
  PR: number | null;
  pr_reps: number | null;
  best_estimated_1rm: number | null;
  best_session_volume: number | null;
  max_reps: number | null;
  last_reps: number | null;
  last_weight: number | null;
  last_sets: SetPair[] | null;
  last_performed_at: Date | null;
  total_sessions: number;
  total_sets: number;
  total_reps: number;
  total_volume: number;
};

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
    const snapshots: Array<{
      id: string;
      snapshot: StoredExerciseStats | null;
    }> = ids.map((id) => ({
      id,
      snapshot: buildExerciseStats(histories.get(id)?.sessions ?? []),
    }));
    const upserts = snapshots.filter(
      (s): s is { id: string; snapshot: StoredExerciseStats } =>
        s.snapshot !== null,
    );
    const vanished = snapshots.filter((s) => !s.snapshot).map((s) => s.id);

    await this.upsert(manager, userId, upserts);
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

  /**
   * Adds a workout that was just saved to the stats of its exercises and
   * returns the records it set, without reading the history again: the stored
   * stats already hold every best value a new session has to beat (see the
   * equivalence tests of addSession and recordsAgainst). The stats rows are
   * locked first, so two workouts saved at the same time are added one after
   * the other instead of overwriting each other's totals. An exercise without
   * stats yet is rebuilt from its history, which is then this workout alone
   * unless the stats were never filled for it.
   */
  async addWorkout(
    manager: EntityManager,
    userId: string,
    workout: { id: string; completionDate: Date },
    exercises: Array<{ id: string; name: string; sets?: SetPair[] | null }>,
  ): Promise<ExerciseRecords[]> {
    const byExercise = new Map<string, { name: string; sets: SetPair[] }>();

    // An exercise listed twice in one workout is one session.
    for (const e of exercises) {
      const entry = byExercise.get(e.id) ?? { name: e.name, sets: [] };

      entry.sets.push(...(e.sets ?? []));
      byExercise.set(e.id, entry);
    }
    const ids = [...byExercise.keys()];

    if (!ids.length) return [];
    const rows: StatsRow[] = await manager.query(
      `SELECT * FROM user_exercise_stats
        WHERE user_id = $1 AND exercise_id = ANY($2::uuid[])
        FOR UPDATE`,
      [userId, ids],
    );
    const stored = new Map(
      rows
        .filter((row) => row.last_performed_at)
        .map((row) => [row.exercise_id, fromRow(row)]),
    );
    const result: ExerciseRecords[] = [];
    const upserts: Array<{ id: string; snapshot: StoredExerciseStats }> = [];

    for (const [id, { name, sets }] of byExercise) {
      const previous = stored.get(id);

      if (!previous) continue;
      upserts.push({
        id,
        snapshot: addSession(previous, sets, workout.completionDate),
      });
      result.push({
        exerciseId: id,
        exerciseName: name,
        records: recordsAgainst(
          summarizeSession(sets),
          previousBestsOf(previous),
        ),
      });
    }
    await this.upsert(manager, userId, upserts);
    const missing = ids.filter((id) => !stored.has(id));
    const histories = await this.recompute(manager, userId, missing);

    for (const history of histories.values())
      result.push({
        exerciseId: history.exerciseId,
        exerciseName: history.exerciseName,
        records: detectPersonalRecords(history.sessions, workout.id),
      });
    return result;
  }

  // One statement for every exercise, keyed on the (user, exercise) unique
  // constraint, instead of a read then a write per exercise.
  private async upsert(
    manager: EntityManager,
    userId: string,
    upserts: Array<{ id: string; snapshot: StoredExerciseStats }>,
  ) {
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

  /**
   * The user's stats on one exercise next to those of someone they follow.
   * Theirs come from their published workouts only, recomputed on the fly:
   * the stored stats cover every workout, unpublished ones included.
   */
  async compareWithFollowed(
    userId: string,
    otherId: string,
    exerciseId: string,
  ): Promise<ExerciseComparisonDto> {
    if (otherId === userId)
      throw new BadRequestException(
        "Choisissez quelqu'un d'autre que vous pour comparer vos stats.",
      );
    const manager = this.statsRepository.manager;
    const [[user], [exercise], mine, theirs] = await Promise.all([
      manager.query<ExerciseComparisonDto['user'][]>(
        `SELECT u.id, u."uniqueName", u."displayName",
                COALESCE(u."avatarThumbnailUrl", u."avatarUrl") AS "avatarThumbnailUrl"
           FROM users u
           JOIN connections c ON c."followingId" = u.id AND c."followerId" = $1
          WHERE u.id = $2`,
        [userId, otherId],
      ),
      manager.query<Array<{ id: string; name: string }>>(
        `SELECT id, name FROM exercises WHERE id = $1`,
        [exerciseId],
      ),
      manager
        .query<StatsRow[]>(
          `SELECT * FROM user_exercise_stats
            WHERE user_id = $1 AND exercise_id = $2`,
          [userId, exerciseId],
        )
        .then(([row]) => row && fromRow(row)),
      this.loadHistories(manager, otherId, [exerciseId], true),
    ]);

    if (!exercise) throw new NotFoundException('Exercise not found');
    if (!user)
      throw new ForbiddenException(
        'Suivez cette personne pour comparer vos stats avec les siennes.',
      );
    const history = theirs.get(exerciseId);

    return {
      exercise,
      me: mine ? compared(mine) : null,
      user,
      them: history ? compared(buildExerciseStats(history.sessions)) : null,
    };
  }

  private async loadHistories(
    manager: EntityManager,
    userId: string,
    exerciseIds: string[],
    publishedOnly = false,
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
          AND e."exerciseId" = ANY($2::uuid[])
          ${publishedOnly ? 'AND EXISTS (SELECT 1 FROM posts p WHERE p."workoutId" = w.id)' : ''}`,
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

function fromRow(row: StatsRow): StoredExerciseStats {
  return {
    totalSessions: row.total_sessions,
    totalSets: row.total_sets,
    totalReps: row.total_reps,
    totalVolume: row.total_volume,
    prWeight: row.PR,
    prReps: row.pr_reps,
    bestEstimatedOneRepMax: row.best_estimated_1rm,
    bestSessionVolume: row.best_session_volume,
    maxReps: row.max_reps,
    lastPerformedAt: row.last_performed_at!,
    lastSets: row.last_sets ?? [],
    lastWeight: row.last_weight ?? 0,
    lastReps: row.last_reps ?? 0,
  };
}

function compared(
  stats: Omit<StoredExerciseStats, 'lastWorkoutId'> | null,
): ComparedExerciseStatsDto | null {
  return (
    stats && {
      heaviestWeight: stats.prWeight,
      estimatedOneRepMax: stats.bestEstimatedOneRepMax,
      bestSessionVolume: stats.bestSessionVolume,
      maxReps: stats.maxReps,
      totalSessions: stats.totalSessions,
      lastPerformedAt: stats.lastPerformedAt,
    }
  );
}

function toColumns(snapshot: StoredExerciseStats) {
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
