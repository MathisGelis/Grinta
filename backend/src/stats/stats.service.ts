import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsSelect,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CompletedWorkout } from '../workouts/entities/completed-workout.entity';
import { PlannedWorkout } from '../workouts/entities/planned-workout.entity';
import { User } from '../users/entities/users.entity';
import { AuthUser } from '../auth/auth-user.interface';
import { DetailedMuscleGroup } from '../exercise/enums/detailed-muscle.enum';
import { Exercise } from '../exercise/entities/exercise.entity';
import { HEATMAP_MAX_LEVEL } from './constants/progression';
import { BASELINE_PERIODS } from './constants/comparison';
import { DEFAULT_BODY_WEIGHT_KG } from './constants/met-values';
import {
  BodyRegion,
  MUSCLE_CATEGORY,
  MUSCLE_REGION,
  MuscleCategory,
} from './constants/muscle-groups';
import { AdherenceQueryDto } from './dto/adherence-query.dto';
import { HeatmapQueryDto } from './dto/heatmap-query.dto';
import { PeriodQueryDto } from './dto/period-query.dto';
import {
  ProgressionPeriod,
  ProgressionQueryDto,
} from './dto/progression-query.dto';
import {
  AdherenceDto,
  ComparisonsDto,
  HeatmapDto,
  ProgressionDto,
  RecordsDto,
  WorkoutRecordDto,
  WorkoutTypeBreakdownDto,
} from './dto/stats-response.dto';
import { StatsCalculatorService } from './stats-calculator.service';
import { compareToRealLife } from '../common/utils/real-life-comparison';
import { rankByNeglectedMuscles } from './utils/workout-suggestion';
import { StatsPeriod } from './dto/period-query.dto';
import {
  BestSetRow,
  BreakdownRow,
  HeatmapRow,
  PeriodTotals,
  ProgressionRow,
  SessionVolumeRow,
} from './stats.types';
import {
  addDays,
  dayKey,
  dayRange,
  DateRange,
  elapsedFraction,
  percentChange,
  precedingPeriodRanges,
  resolvePeriodRange,
  previousPeriodRange,
  round,
  startOfDay,
  startOfWeek,
  sum,
} from './utils/stats.util';

/**
 * Columns the calculator reads. The workouts are loaded with one join row per
 * exercise, so every column left out here (the workout description, the
 * exercise image URL, timestamps) would otherwise travel from the database
 * once per exercise of every workout in the period.
 */
const WORKOUT_STATS_SELECT: FindOptionsSelect<CompletedWorkout> = {
  id: true,
  title: true,
  completionDate: true,
  totalDurationSeconds: true,
  exercises: {
    id: true,
    sets: true,
    timerSeconds: true,
    exercise: {
      id: true,
      name: true,
      equipment_type: true,
      primary_muscle: true,
      secondary_muscles: true,
      exercise_type: true,
    },
  },
};

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(CompletedWorkout)
    private readonly completedRepo: Repository<CompletedWorkout>,
    @InjectRepository(PlannedWorkout)
    private readonly plannedRepo: Repository<PlannedWorkout>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    private readonly calculator: StatsCalculatorService,
  ) {}

  async getWorkoutStats(
    user: AuthUser,
    workoutId: string,
    bodyWeightKg?: number,
  ) {
    const workout = await this.completedRepo.findOne({
      where: { id: workoutId, user: { id: user.id } },
      relations: ['exercises', 'exercises.exercise'],
      select: WORKOUT_STATS_SELECT,
    });

    if (!workout) throw new NotFoundException('Completed workout not found');
    const { start, end } = dayRange(workout.completionDate);
    const [weightKg, dayWorkouts] = await Promise.all([
      this.resolveBodyWeight(user.id, bodyWeightKg),
      this.completedRepo.find({
        where: { user: { id: user.id }, completionDate: Between(start, end) },
        relations: ['exercises'],
        select: { id: true, exercises: { id: true, sets: true } },
      }),
    ]);
    const { exercises, totalSets, totalReps, totalVolume, estimatedCalories } =
      this.workoutTotals(workout, weightKg);
    const fullDayLoad = round(
      dayWorkouts.reduce((acc, w) => acc + this.calculator.workoutVolume(w), 0),
    );

    const allSets = workout.exercises.flatMap((e) => e.sets ?? []);
    const averageWeightPerSet = allSets.length
      ? round(sum(allSets, (s) => s.weight) / allSets.length)
      : 0;

    return {
      workoutId: workout.id,
      title: workout.title,
      completionDate: workout.completionDate,
      totalDurationSeconds: workout.totalDurationSeconds,
      estimatedCalories,
      totalSets,
      totalReps,
      totalVolume,
      realLifeComparison: compareToRealLife(totalVolume),
      fullDayLoad,
      workoutsCompletedThatDay: dayWorkouts.length,
      numberOfExercises: workout.exercises.length,
      averageWeightPerSet,
      averageVolumePerSet: totalSets ? round(totalVolume / totalSets) : 0,
      musclesWorked: this.calculator.collectMuscles(workout.exercises),
      exercises,
    };
  }

  /**
   * Totals of a workout loaded with its exercises. The body weight only
   * changes the calories. Shared by the owner's stats and by a workout read
   * through a post.
   */
  workoutTotals(workout: CompletedWorkout, bodyWeightKg: number) {
    const durations = this.calculator.distributeDuration(workout);
    const exercises = workout.exercises.map((cwe, i) =>
      this.calculator.computeExerciseStats(cwe, durations[i], bodyWeightKg),
    );
    const totalVolume = round(sum(exercises, (e) => e.volume));

    return {
      exercises,
      totalSets: sum(exercises, (e) => e.sets),
      totalReps: sum(exercises, (e) => e.reps),
      totalVolume,
      estimatedCalories: round(sum(exercises, (e) => e.estimatedCalories)),
    };
  }

  /**
   * The totals of a workout shown through a post. Other people see calories
   * computed for the default body weight: with the author's own, the calories
   * would give their weight away.
   */
  async publishedWorkoutStats(
    workout: CompletedWorkout,
    authorId: string,
    viewerId: string,
  ) {
    const weightKg =
      authorId === viewerId
        ? await this.resolveBodyWeight(authorId)
        : DEFAULT_BODY_WEIGHT_KG;
    const { totalSets, totalReps, totalVolume, estimatedCalories } =
      this.workoutTotals(workout, weightKg);

    return {
      estimatedCalories,
      totalVolume,
      totalSets,
      totalReps,
      realLifeComparison: compareToRealLife(totalVolume),
    };
  }

  /**
   * Picks, among the user's planned workouts, the one that works best the
   * muscles left aside over the period (this week by default). The muscles
   * trained so far are counted in effective sets, as in
   * GET /stats/muscle-distribution; a planned workout counts its planned
   * sets the same way, one per exercise when it plans none. Comes with two
   * alternatives and the reasons: each muscle the workout works with what it
   * already got this period.
   */
  async suggestPlannedWorkout(
    user: AuthUser,
    period: StatsPeriod = StatsPeriod.WEEK,
    date?: string,
  ) {
    const range = resolvePeriodRange(period, date);
    const [workouts, planned] = await Promise.all([
      this.fetchWorkoutsInRange(user.id, range),
      this.plannedRepo.find({
        where: { user: { id: user.id } },
        relations: ['exercises'],
      }),
    ]);
    const { perMuscle } = this.calculator.effectiveSetsByMuscle(workouts);
    const ranked = rankByNeglectedMuscles(
      perMuscle,
      planned.map((workout) => {
        const targets = new Map<DetailedMuscleGroup, number>();

        for (const pwe of workout.exercises ?? []) {
          const sets = Math.max(1, pwe.sets?.length ?? 0);

          for (const { muscle, weight } of this.calculator.muscleContributions(
            pwe,
          ))
            targets.set(muscle, (targets.get(muscle) ?? 0) + sets * weight);
        }
        return { id: workout.id, targets };
      }),
    );
    const byId = new Map(planned.map((w) => [w.id, w]));
    const withWorkout = (r: (typeof ranked)[number]) => {
      const workout = byId.get(r.id)!;

      return {
        workout: {
          id: workout.id,
          title: workout.title,
          description: workout.description ?? null,
          totalExercises: workout.exercises.length,
        },
        score: r.score,
        muscles: r.muscles,
      };
    };

    return {
      period,
      rangeStart: range.start,
      rangeEnd: range.end,
      workedMuscles: [...perMuscle.entries()]
        .map(([muscle, sets]) => ({ muscle, effectiveSets: round(sets) }))
        .sort((a, b) => b.effectiveSets - a.effectiveSets),
      suggestion: ranked.length ? withWorkout(ranked[0]) : null,
      alternatives: ranked.slice(1, 3).map(withWorkout),
    };
  }

  async getMuscleDistribution(user: AuthUser, query: PeriodQueryDto) {
    const range = resolvePeriodRange(query.period, query.date);
    const workouts = await this.fetchWorkoutsInRange(user.id, range);
    const { perMuscle, total } =
      this.calculator.effectiveSetsByMuscle(workouts);
    const distribution = [...perMuscle.entries()]
      .map(([muscle, sets]) => ({
        muscle,
        effectiveSets: round(sets),
        percentage: total ? round((sets / total) * 100, 1) : 0,
      }))
      .sort((a, b) => b.effectiveSets - a.effectiveSets);

    return {
      period: query.period,
      rangeStart: range.start,
      rangeEnd: range.end,
      totalWorkouts: workouts.length,
      totalEffectiveSets: round(total),
      distribution,
    };
  }

  async getPeriodSummary(user: AuthUser, query: PeriodQueryDto) {
    const current = resolvePeriodRange(query.period, query.date);
    const previous = previousPeriodRange(query.period, query.date);
    const [weightKg, currentWorkouts, previousWorkouts] = await Promise.all([
      this.resolveBodyWeight(user.id),
      this.fetchWorkoutsInRange(user.id, current),
      this.fetchWorkoutsInRange(user.id, previous),
    ]);

    const currentTotals = this.calculator.aggregateTotals(
      currentWorkouts,
      weightKg,
    );
    const previousTotals = this.calculator.aggregateTotals(
      previousWorkouts,
      weightKg,
    );
    const metrics = [
      'workouts',
      'durationSeconds',
      'sets',
      'reps',
      'volume',
      'calories',
    ] as const;
    const delta: Record<string, unknown> = {};

    for (const m of metrics) {
      const c = currentTotals[m];
      const p = previousTotals[m];
      delta[m] = {
        current: c,
        previous: p,
        change: round(c - p),
        changePct: percentChange(c, p),
      };
    }
    return {
      period: query.period,
      rangeStart: current.start,
      rangeEnd: current.end,
      current: currentTotals,
      previous: previousTotals,
      delta,
    };
  }

  async getConsistency(user: AuthUser) {
    const since = startOfDay(addDays(new Date(), -365));
    const workouts = await this.completedRepo.find({
      where: {
        user: { id: user.id },
        completionDate: MoreThanOrEqual(since),
      },
      select: ['id', 'completionDate'],
      order: { completionDate: 'ASC' },
    });
    const trainingDays = [
      ...new Set(workouts.map((w) => dayKey(w.completionDate))),
    ];

    const daySet = new Set(trainingDays);
    let currentStreak = 0;
    let cursor = startOfDay(new Date());

    if (!daySet.has(dayKey(cursor))) cursor = addDays(cursor, -1);
    while (daySet.has(dayKey(cursor))) {
      currentStreak++;
      cursor = addDays(cursor, -1);
    }
    let longestStreak = trainingDays.length ? 1 : 0;
    let run = trainingDays.length ? 1 : 0;

    for (let i = 1; i < trainingDays.length; i++) {
      const prev = new Date(trainingDays[i - 1]);
      const curr = new Date(trainingDays[i]);
      const gapDays = Math.round((+curr - +prev) / 86_400_000);

      run = gapDays === 1 ? run + 1 : 1;
      longestStreak = Math.max(longestStreak, run);
    }
    const currentWeekStart = startOfWeek(new Date());
    const weeklyActivity: { weekStart: Date; workoutCount: number }[] = [];

    for (let k = 11; k >= 0; k--) {
      const weekStart = addDays(currentWeekStart, -7 * k);
      const weekEnd = addDays(weekStart, 7);
      const count = workouts.filter(
        (w) => w.completionDate >= weekStart && w.completionDate < weekEnd,
      ).length;

      weeklyActivity.push({ weekStart, workoutCount: count });
    }
    const averageWorkoutsPerWeek = round(
      sum(weeklyActivity, (w) => w.workoutCount) / 12,
      1,
    );

    return {
      totalWorkouts: workouts.length,
      totalTrainingDays: trainingDays.length,
      currentStreakDays: currentStreak,
      longestStreakDays: longestStreak,
      averageWorkoutsPerWeek,
      weeklyActivity,
    };
  }

  async getMuscleFrequency(user: AuthUser) {
    const now = new Date();
    const since = startOfDay(addDays(now, -90));
    const sevenDaysAgo = addDays(now, -7);
    const thirtyDaysAgo = addDays(now, -30);
    const workouts = await this.completedRepo.find({
      where: {
        user: { id: user.id },
        completionDate: MoreThanOrEqual(since),
      },
      relations: ['exercises', 'exercises.exercise'],
      select: WORKOUT_STATS_SELECT,
      order: { completionDate: 'DESC' },
    });

    type Acc = {
      lastTrained: Date | null;
      sessions: number;
      sets7: number;
      sets30: number;
    };
    const acc = new Map<DetailedMuscleGroup, Acc>();
    const get = (m: DetailedMuscleGroup): Acc => {
      if (!acc.has(m))
        acc.set(m, { lastTrained: null, sessions: 0, sets7: 0, sets30: 0 });
      return acc.get(m)!;
    };

    for (const workout of workouts) {
      const touched = new Set<DetailedMuscleGroup>();

      for (const cwe of workout.exercises) {
        const setCount = cwe.sets?.length ?? 0;

        if (!cwe.exercise) continue;
        for (const { muscle, weight } of this.calculator.muscleContributions(
          cwe,
        )) {
          const entry = get(muscle);

          if (!entry.lastTrained || workout.completionDate > entry.lastTrained)
            entry.lastTrained = workout.completionDate;
          touched.add(muscle);
          if (workout.completionDate >= thirtyDaysAgo)
            entry.sets30 += setCount * weight;
          if (workout.completionDate >= sevenDaysAgo)
            entry.sets7 += setCount * weight;
        }
      }
      for (const m of touched) get(m).sessions++;
    }

    const muscles = Object.values(DetailedMuscleGroup).map((muscle) => {
      const e = acc.get(muscle);
      const daysSince = e?.lastTrained
        ? Math.floor((+now - +e.lastTrained) / 86_400_000)
        : null;

      return {
        muscle,
        lastTrained: e?.lastTrained ?? null,
        daysSinceLastTrained: daysSince,
        sessionsLast90Days: e?.sessions ?? 0,
        effectiveSetsLast7Days: round(e?.sets7 ?? 0),
        effectiveSetsLast30Days: round(e?.sets30 ?? 0),
        status: this.calculator.recoveryStatus(daysSince),
      };
    });

    muscles.sort(
      (a, b) =>
        (b.daysSinceLastTrained ?? 9999) - (a.daysSinceLastTrained ?? 9999),
    );

    return { generatedAt: now, muscles };
  }

  async getTrainingBalance(user: AuthUser, query: PeriodQueryDto) {
    const range = resolvePeriodRange(query.period, query.date);
    const workouts = await this.fetchWorkoutsInRange(user.id, range);
    const { perMuscle, total } =
      this.calculator.effectiveSetsByMuscle(workouts);
    const categoryTotals = new Map<MuscleCategory, number>();
    const regionTotals = new Map<BodyRegion, number>();

    for (const [muscle, sets] of perMuscle) {
      const cat = MUSCLE_CATEGORY[muscle];
      const reg = MUSCLE_REGION[muscle];

      categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + sets);
      regionTotals.set(reg, (regionTotals.get(reg) ?? 0) + sets);
    }

    const toGroups = <K extends string>(map: Map<K, number>) =>
      [...map.entries()]
        .map(([name, sets]) => ({
          name,
          effectiveSets: round(sets),
          percentage: total ? round((sets / total) * 100, 1) : 0,
        }))
        .sort((a, b) => b.effectiveSets - a.effectiveSets);

    const push = categoryTotals.get(MuscleCategory.PUSH) ?? 0;
    const pull = categoryTotals.get(MuscleCategory.PULL) ?? 0;
    const upper = regionTotals.get(BodyRegion.UPPER) ?? 0;
    const lower = regionTotals.get(BodyRegion.LOWER) ?? 0;

    const pushPullRatio = pull > 0 ? round(push / pull) : null;
    const upperLowerRatio = lower > 0 ? round(upper / lower) : null;

    return {
      period: query.period,
      rangeStart: range.start,
      rangeEnd: range.end,
      totalEffectiveSets: round(total),
      byCategory: toGroups(categoryTotals),
      byRegion: toGroups(regionTotals),
      pushPullRatio,
      upperLowerRatio,
      insights: this.calculator.balanceInsights(
        pushPullRatio,
        upperLowerRatio,
        lower,
      ),
    };
  }

  // -------------------------------------------------------------------------
  // Progression, records, adherence, comparisons, breakdown, heatmap
  //
  // The SQL here only reduces the history to the few rows each calculation
  // needs (one user, one exercise, one window, or an aggregate per exercise,
  // type or day). The maths lives in StatsCalculatorService.
  // -------------------------------------------------------------------------

  async getProgression(
    user: AuthUser,
    query: ProgressionQueryDto,
  ): Promise<ProgressionDto> {
    const exercise = await this.exerciseRepo.findOne({
      where: { id: query.exerciseId },
    });

    if (!exercise) throw new NotFoundException('Exercise not found');
    const now = new Date();
    const rangeStart = progressionRangeStart(query.period, now);
    const rows = await this.rows<ProgressionRow>(
      `SELECT to_char(w."completionDate", 'YYYY-MM-DD') AS day,
              w.id AS "workoutId",
              e.sets AS sets
         FROM completed_workouts w
         JOIN completed_workout_exercises e ON e."workoutId" = w.id
        WHERE w."userId" = $1
          AND e."exerciseId" = $2
          AND ($3::date IS NULL OR w."completionDate" >= $3::date)
        ORDER BY w."completionDate"`,
      [user.id, exercise.id, rangeStart ? dayKey(rangeStart) : null],
    );
    const points = this.calculator.progressionPoints(rows, query.metric);

    return {
      exercise: {
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primary_muscle,
      },
      metric: query.metric,
      period: query.period,
      rangeStart,
      rangeEnd: now,
      summary: this.calculator.summarizeProgression(points),
      points,
    };
  }

  async getRecords(user: AuthUser): Promise<RecordsDto> {
    const [bestSets, sessionVolumes, longest, highestVolume, days] =
      await Promise.all([
        // Heaviest set for each exercise and rep count, earliest date on a tie.
        this.rows<BestSetRow>(
          `SELECT DISTINCT ON (x."exerciseId", x.reps)
                  x."exerciseId", x.name, x."primaryMuscle", x.reps, x.weight,
                  x."achievedAt"
             FROM (
               SELECT e."exerciseId" AS "exerciseId", ex.name AS name,
                      ex.primary_muscle AS "primaryMuscle",
                      (s->>'reps')::float8 AS reps,
                      (s->>'weight')::float8 AS weight,
                      w."completionDate" AS "achievedAt"
                 FROM completed_workouts w
                 JOIN completed_workout_exercises e ON e."workoutId" = w.id
                 JOIN exercises ex ON ex.id = e."exerciseId"
                CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e.sets, '[]'::jsonb)) s
                WHERE w."userId" = $1
             ) x
            WHERE x.reps > 0 AND x.weight > 0
            ORDER BY x."exerciseId", x.reps, x.weight DESC, x."achievedAt"`,
          [user.id],
        ),
        // Highest volume load of a single workout, per exercise.
        this.rows<SessionVolumeRow>(
          `SELECT DISTINCT ON (v."exerciseId")
                  v."exerciseId", v."workoutId", v.volume, v."achievedAt"
             FROM (
               SELECT e."exerciseId" AS "exerciseId", w.id AS "workoutId",
                      w."completionDate" AS "achievedAt",
                      SUM((s->>'reps')::float8 * (s->>'weight')::float8) AS volume
                 FROM completed_workouts w
                 JOIN completed_workout_exercises e ON e."workoutId" = w.id
                CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e.sets, '[]'::jsonb)) s
                WHERE w."userId" = $1
                GROUP BY e."exerciseId", w.id, w."completionDate"
             ) v
            WHERE v.volume > 0
            ORDER BY v."exerciseId", v.volume DESC, v."achievedAt"`,
          [user.id],
        ),
        this.rows<WorkoutRecordDto>(
          `SELECT id AS "workoutId", title,
                  "totalDurationSeconds" AS value, "completionDate" AS "achievedAt"
             FROM completed_workouts
            WHERE "userId" = $1
            ORDER BY "totalDurationSeconds" DESC, "completionDate"
            LIMIT 1`,
          [user.id],
        ),
        this.rows<WorkoutRecordDto>(
          `SELECT w.id AS "workoutId", w.title,
                  SUM((s->>'reps')::float8 * (s->>'weight')::float8) AS value,
                  w."completionDate" AS "achievedAt"
             FROM completed_workouts w
             JOIN completed_workout_exercises e ON e."workoutId" = w.id
            CROSS JOIN LATERAL jsonb_array_elements(COALESCE(e.sets, '[]'::jsonb)) s
            WHERE w."userId" = $1
            GROUP BY w.id, w.title, w."completionDate"
            ORDER BY value DESC NULLS LAST, w."completionDate"
            LIMIT 1`,
          [user.id],
        ),
        this.rows<{ day: string }>(
          `SELECT DISTINCT to_char("completionDate", 'YYYY-MM-DD') AS day
             FROM completed_workouts
            WHERE "userId" = $1`,
          [user.id],
        ),
      ]);
    const dayKeys = days.map((d) => d.day);
    const volumeRecord = highestVolume[0];

    return {
      generatedAt: new Date(),
      exercises: this.calculator.exerciseRecords(bestSets, sessionVolumes),
      workouts: {
        longestWorkout: longest[0] ?? null,
        highestVolumeWorkout:
          volumeRecord && Number(volumeRecord.value) > 0
            ? { ...volumeRecord, value: round(Number(volumeRecord.value)) }
            : null,
        longestStreakDays: this.calculator.longestStreak(dayKeys),
        totalTrainingDays: dayKeys.length,
      },
    };
  }

  /**
   * Compares a session with a plan. The completed workout must be the
   * caller's. The plan can be any readable planned workout, the same openness
   * as GET /workouts/planned/:id, so a user can follow a programme made by
   * someone else.
   */
  async getAdherence(
    user: AuthUser,
    query: AdherenceQueryDto,
  ): Promise<AdherenceDto> {
    const [completed, planned] = await Promise.all([
      this.completedRepo.findOne({
        where: { id: query.completedWorkoutId, user: { id: user.id } },
        relations: ['exercises', 'exercises.exercise'],
      }),
      this.plannedRepo.findOne({
        where: { id: query.plannedWorkoutId },
        relations: ['exercises', 'exercises.exercise'],
      }),
    ]);

    if (!completed) throw new NotFoundException('Completed workout not found');
    if (!planned) throw new NotFoundException('Planned workout not found');
    return this.calculator.computeAdherence(planned, completed);
  }

  async getComparisons(
    user: AuthUser,
    query: PeriodQueryDto,
  ): Promise<ComparisonsDto> {
    const now = new Date();
    const current = resolvePeriodRange(query.period, query.date);
    const baselineRanges = precedingPeriodRanges(
      query.period,
      query.date,
      BASELINE_PERIODS[query.period],
    );
    const window: DateRange = {
      start: baselineRanges[baselineRanges.length - 1].start,
      end: baselineRanges[0].end,
    };
    const [weightKg, currentWorkouts, windowWorkouts, first] =
      await Promise.all([
        this.resolveBodyWeight(user.id),
        this.fetchWorkoutsInRange(user.id, current),
        this.fetchWorkoutsInRange(user.id, window),
        this.completedRepo
          .createQueryBuilder('w')
          .select('MIN(w."completionDate")', 'first')
          .where('w."userId" = :userId', { userId: user.id })
          .getRawOne<{ first: Date | null }>(),
      ]);
    // A period counts only if the user had already started before it began,
    // so the first, partial period and the time before signing up are left out.
    const firstWorkout = first?.first ?? null;
    const usable = firstWorkout
      ? baselineRanges.filter((r) => firstWorkout < r.start)
      : [];
    const totalsOf = (workouts: CompletedWorkout[]): PeriodTotals => {
      const t = this.calculator.aggregateTotals(workouts, weightKg);

      return {
        workouts: t.workouts,
        durationSeconds: t.durationSeconds,
        sets: t.sets,
        reps: t.reps,
        volume: t.volume,
        calories: t.calories,
      };
    };
    const baselineTotals = usable.map((range) =>
      totalsOf(
        windowWorkouts.filter(
          (w) =>
            w.completionDate >= range.start && w.completionDate <= range.end,
        ),
      ),
    );
    const average = baselineTotals.length
      ? this.calculator.averageTotals(baselineTotals)
      : null;
    const currentTotals = totalsOf(currentWorkouts);
    const elapsed = elapsedFraction(current, now);
    const comparison = this.calculator.compareToBaseline(
      currentTotals,
      average,
      elapsed,
    );

    return {
      period: query.period,
      rangeStart: current.start,
      rangeEnd: current.end,
      elapsedPct: round(elapsed * 100, 1),
      current: currentTotals,
      baseline: average
        ? {
            periodsConsidered: usable.length,
            rangeStart: usable[usable.length - 1].start,
            rangeEnd: usable[0].end,
            average,
          }
        : null,
      comparison,
      insights: this.calculator.comparisonInsights(
        comparison,
        usable.length,
        query.period,
        elapsed,
      ),
    };
  }

  async getWorkoutTypeBreakdown(
    user: AuthUser,
    query: PeriodQueryDto,
  ): Promise<WorkoutTypeBreakdownDto> {
    const range = resolvePeriodRange(query.period, query.date);
    const [byExerciseType, byEquipmentType] = await Promise.all([
      this.breakdownRows(user.id, range, 'exercise_type'),
      this.breakdownRows(user.id, range, 'equipment_type'),
    ]);

    return {
      period: query.period,
      rangeStart: range.start,
      rangeEnd: range.end,
      totalSets: byExerciseType.reduce((acc, r) => acc + r.sets, 0),
      byExerciseType: this.calculator.breakdownSlices(byExerciseType),
      byEquipmentType: this.calculator.breakdownSlices(byEquipmentType),
    };
  }

  async getHeatmap(
    user: AuthUser,
    query: HeatmapQueryDto,
  ): Promise<HeatmapDto> {
    const year = query.year ?? new Date().getUTCFullYear();
    const rows = await this.rows<HeatmapRow>(
      `SELECT to_char(w."completionDate", 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS workouts,
              COALESCE(SUM(w."totalDurationSeconds"), 0)::int AS "durationSeconds"
         FROM completed_workouts w
        WHERE w."userId" = $1
          AND w."completionDate" >= $2::date
          AND w."completionDate" < $3::date
        GROUP BY 1
        ORDER BY 1`,
      [user.id, `${year}-01-01`, `${year + 1}-01-01`],
    );
    const days = this.calculator.heatmapDays(rows);

    return {
      year,
      totalWorkouts: rows.reduce((acc, r) => acc + r.workouts, 0),
      activeDays: rows.length,
      totalDurationSeconds: rows.reduce((acc, r) => acc + r.durationSeconds, 0),
      maxWorkoutsInDay: Math.max(0, ...rows.map((r) => r.workouts)),
      longestStreakDays: this.calculator.longestStreak(rows.map((r) => r.day)),
      maxLevel: HEATMAP_MAX_LEVEL,
      days,
    };
  }

  /** Runs a read-only SQL reduction and types its rows. */
  private rows<T>(sql: string, params: unknown[]): Promise<T[]> {
    return this.completedRepo.query(sql, params);
  }

  private breakdownRows(
    userId: string,
    range: DateRange,
    column: keyof typeof BREAKDOWN_COLUMNS,
  ): Promise<BreakdownRow[]> {
    // The column comes from a closed set of constants, never from the request.
    const group = BREAKDOWN_COLUMNS[column];

    return this.rows<BreakdownRow>(
      `SELECT ${group}::text AS type,
              COUNT(DISTINCT ex.id)::int AS exercises,
              COALESCE(SUM(jsonb_array_length(COALESCE(e.sets, '[]'::jsonb))), 0)::int AS sets,
              COALESCE(SUM((
                SELECT SUM((s->>'reps')::float8 * (s->>'weight')::float8)
                  FROM jsonb_array_elements(COALESCE(e.sets, '[]'::jsonb)) s
              )), 0)::float8 AS volume
         FROM completed_workouts w
         JOIN completed_workout_exercises e ON e."workoutId" = w.id
         JOIN exercises ex ON ex.id = e."exerciseId"
        WHERE w."userId" = $1
          AND w."completionDate" BETWEEN $2 AND $3
        GROUP BY ${group}`,
      [userId, range.start, range.end],
    );
  }

  private async resolveBodyWeight(
    userId: string,
    override?: number,
  ): Promise<number> {
    if (override && override > 0) return override;

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'weight'],
    });
    return user?.weight ?? DEFAULT_BODY_WEIGHT_KG;
  }

  private fetchWorkoutsInRange(
    userId: string,
    range: DateRange,
  ): Promise<CompletedWorkout[]> {
    return this.completedRepo.find({
      where: {
        user: { id: userId },
        completionDate: Between(range.start, range.end),
      },
      relations: ['exercises', 'exercises.exercise'],
      select: WORKOUT_STATS_SELECT,
    });
  }
}

const BREAKDOWN_COLUMNS = {
  exercise_type: 'ex.exercise_type',
  equipment_type: 'ex.equipment_type',
} as const;

function progressionRangeStart(
  period: ProgressionPeriod,
  now: Date,
): Date | null {
  const days = {
    [ProgressionPeriod.ONE_MONTH]: 30,
    [ProgressionPeriod.THREE_MONTHS]: 90,
    [ProgressionPeriod.SIX_MONTHS]: 180,
    [ProgressionPeriod.ONE_YEAR]: 365,
    [ProgressionPeriod.ALL]: null,
  }[period];

  return days === null ? null : startOfDay(addDays(now, -days));
}
