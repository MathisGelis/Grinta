import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, Repository } from 'typeorm';
import { CompletedWorkout } from '../workouts/entities/completed-workout.entity';
import { PlannedWorkout } from '../workouts/entities/planned-workout.entity';
import { User } from '../users/entities/users.entity';
import { DetailedMuscleGroup } from '../exercise/enums/detailed-muscle.enum';
import { DEFAULT_BODY_WEIGHT_KG } from './constants/met-values';
import {
  BodyRegion,
  MUSCLE_CATEGORY,
  MUSCLE_REGION,
  MuscleCategory,
} from './constants/muscle-groups';
import { PeriodQueryDto } from './dto/period-query.dto';
import { StatsCalculatorService } from './stats-calculator.service';
import {
  addDays,
  dayKey,
  dayRange,
  DateRange,
  percentChange,
  resolvePeriodRange,
  previousPeriodRange,
  round,
  startOfDay,
  startOfWeek,
  sum,
} from './utils/stats.util';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(CompletedWorkout)
    private readonly completedRepo: Repository<CompletedWorkout>,
    @InjectRepository(PlannedWorkout)
    private readonly plannedRepo: Repository<PlannedWorkout>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly calculator: StatsCalculatorService,
  ) {}

  async getWorkoutStats(user: any, workoutId: string, bodyWeightKg?: number) {
    const workout = await this.completedRepo.findOne({
      where: { id: workoutId, user: { id: user.id } },
      relations: ['exercises', 'exercises.exercise'],
    });

    if (!workout) throw new NotFoundException('Completed workout not found');
    const weightKg = await this.resolveBodyWeight(user.id, bodyWeightKg);
    const durations = this.calculator.distributeDuration(workout);
    const exercises = workout.exercises.map((cwe, i) =>
      this.calculator.computeExerciseStats(cwe, durations[i], weightKg),
    );

    const totalSets = sum(exercises, (e) => e.sets);
    const totalReps = sum(exercises, (e) => e.reps);
    const totalVolume = sum(exercises, (e) => e.volume);
    const estimatedCalories = sum(exercises, (e) => e.estimatedCalories);

    const { start, end } = dayRange(workout.completionDate);
    const dayWorkouts = await this.completedRepo.find({
      where: { user: { id: user.id }, completionDate: Between(start, end) },
      relations: ['exercises'],
    });
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
      estimatedCalories: round(estimatedCalories),
      totalSets,
      totalReps,
      totalVolume: round(totalVolume),
      fullDayLoad,
      workoutsCompletedThatDay: dayWorkouts.length,
      numberOfExercises: workout.exercises.length,
      averageWeightPerSet,
      averageVolumePerSet: totalSets ? round(totalVolume / totalSets) : 0,
      musclesWorked: this.calculator.collectMuscles(workout.exercises),
      exercises,
    };
  }

  async getMuscleDistribution(user: any, query: PeriodQueryDto) {
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

  async getPeriodSummary(user: any, query: PeriodQueryDto) {
    const current = resolvePeriodRange(query.period, query.date);
    const previous = previousPeriodRange(query.period, query.date);
    const weightKg = await this.resolveBodyWeight(user.id);
    const [currentWorkouts, previousWorkouts] = await Promise.all([
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

  async getConsistency(user: any) {
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

  async getMuscleFrequency(user: any) {
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

  async getTrainingBalance(user: any, query: PeriodQueryDto) {
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
    });
  }
}
