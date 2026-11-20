import { ApiProperty } from '@nestjs/swagger';
import { RealLifeComparisonDto } from '../../common/dto/real-life-comparison.dto';
import { DetailedMuscleGroup } from '../../exercise/enums/detailed-muscle.enum';
import { BalanceInsight, ComparisonInsight } from '../constants/insights';

export class ExerciseStatsDto {
  @ApiProperty() exerciseId: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: DetailedMuscleGroup })
  primaryMuscle: DetailedMuscleGroup;
  @ApiProperty({ description: 'Number of logged sets' }) sets: number;
  @ApiProperty({ description: 'Total reps across all sets' }) reps: number;
  @ApiProperty({ description: 'Volume load = sum of reps x weight (kg)' })
  volume: number;
  @ApiProperty({ description: 'Heaviest weight used in any set (kg)' })
  heaviestWeight: number;
  @ApiProperty({ description: 'Estimated 1RM (Epley formula, kg)' })
  estimatedOneRepMax: number;
  @ApiProperty({ description: 'Estimated calories burned for this exercise' })
  estimatedCalories: number;
  @ApiProperty({ description: 'Time spent on this exercise (seconds)' })
  durationSeconds: number;
}

export class WorkoutStatsDto {
  @ApiProperty() workoutId: string;
  @ApiProperty() title: string;
  @ApiProperty() completionDate: Date;
  @ApiProperty() totalDurationSeconds: number;
  @ApiProperty({ description: 'Estimated calories burned for this workout' })
  estimatedCalories: number;
  @ApiProperty({ description: 'Total number of sets logged' })
  totalSets: number;
  @ApiProperty({ description: 'Total reps across the whole workout' })
  totalReps: number;
  @ApiProperty({ description: 'Volume load for this workout (kg)' })
  totalVolume: number;
  @ApiProperty({
    type: () => RealLifeComparisonDto,
    nullable: true,
    description:
      'totalVolume told as everyday objects, null under 7 kg. object is an English key the app translates',
  })
  realLifeComparison: RealLifeComparisonDto | null;
  @ApiProperty({
    description: 'Combined volume of every workout completed the same day (kg)',
  })
  fullDayLoad: number;
  @ApiProperty({ description: 'How many workouts were completed that day' })
  workoutsCompletedThatDay: number;
  @ApiProperty() numberOfExercises: number;
  @ApiProperty({ description: 'Average weight per set (kg)' })
  averageWeightPerSet: number;
  @ApiProperty({ description: 'Average volume per set (kg)' })
  averageVolumePerSet: number;
  @ApiProperty({ enum: DetailedMuscleGroup, isArray: true })
  musclesWorked: DetailedMuscleGroup[];
  @ApiProperty({ type: () => [ExerciseStatsDto] })
  exercises: ExerciseStatsDto[];
}

export class MuscleSliceDto {
  @ApiProperty({ enum: DetailedMuscleGroup }) muscle: DetailedMuscleGroup;
  @ApiProperty({
    description: 'Effective sets: primary 1.0/set, secondary 0.5/set',
  })
  effectiveSets: number;
  @ApiProperty({ description: 'Share of total effective sets (%)' })
  percentage: number;
}

export class MuscleDistributionDto {
  @ApiProperty() period: string;
  @ApiProperty() rangeStart: Date;
  @ApiProperty() rangeEnd: Date;
  @ApiProperty() totalWorkouts: number;
  @ApiProperty() totalEffectiveSets: number;
  @ApiProperty({ type: () => [MuscleSliceDto] }) distribution: MuscleSliceDto[];
}

export class PeriodTotalsDto {
  @ApiProperty() workouts: number;
  @ApiProperty() durationSeconds: number;
  @ApiProperty() durationMinutes: number;
  @ApiProperty() sets: number;
  @ApiProperty() reps: number;
  @ApiProperty({ description: 'Total volume load (kg)' }) volume: number;
  @ApiProperty({ description: 'Estimated calories burned' }) calories: number;
  @ApiProperty({ description: 'Average workout duration (seconds)' })
  avgWorkoutDurationSeconds: number;
}

export class MetricDeltaDto {
  @ApiProperty() current: number;
  @ApiProperty() previous: number;
  @ApiProperty({ description: 'Absolute change vs previous period' })
  change: number;
  @ApiProperty({ description: 'Percentage change vs previous period' })
  changePct: number;
}

export class PeriodSummaryDto {
  @ApiProperty() period: string;
  @ApiProperty() rangeStart: Date;
  @ApiProperty() rangeEnd: Date;
  @ApiProperty({ type: () => PeriodTotalsDto }) current: PeriodTotalsDto;
  @ApiProperty({ type: () => PeriodTotalsDto }) previous: PeriodTotalsDto;
  @ApiProperty({
    description: 'Per-metric deltas vs the previous period',
    type: 'object',
    additionalProperties: { type: 'object' },
  })
  delta: Record<string, MetricDeltaDto>;
}

export class WeekActivityDto {
  @ApiProperty() weekStart: Date;
  @ApiProperty() workoutCount: number;
}

export class ConsistencyDto {
  @ApiProperty({ description: 'Workouts logged in the last 365 days' })
  totalWorkouts: number;
  @ApiProperty({ description: 'Distinct days trained in the last 365 days' })
  totalTrainingDays: number;
  @ApiProperty({
    description: 'Consecutive days trained, ending today or yesterday',
  })
  currentStreakDays: number;
  @ApiProperty({ description: 'Longest consecutive-day streak in the window' })
  longestStreakDays: number;
  @ApiProperty({
    description: 'Average workouts per week over the last 12 weeks',
  })
  averageWorkoutsPerWeek: number;
  @ApiProperty({
    type: () => [WeekActivityDto],
    description: 'Last 12 weeks, oldest first',
  })
  weeklyActivity: WeekActivityDto[];
}

export type MuscleRecoveryStatus = 'recovering' | 'ready' | 'overdue' | 'never';

export class MuscleFrequencyItemDto {
  @ApiProperty({ enum: DetailedMuscleGroup }) muscle: DetailedMuscleGroup;
  @ApiProperty({ nullable: true }) lastTrained: Date | null;
  @ApiProperty({ nullable: true, description: 'Whole days since last trained' })
  daysSinceLastTrained: number | null;
  @ApiProperty({
    description: 'Sessions touching this muscle in the last 90 days',
  })
  sessionsLast90Days: number;
  @ApiProperty({ description: 'Effective sets in the last 7 days' })
  effectiveSetsLast7Days: number;
  @ApiProperty({ description: 'Effective sets in the last 30 days' })
  effectiveSetsLast30Days: number;
  @ApiProperty({
    description:
      'recovering (<=1d), ready (2-6d), overdue (>=7d), never (untrained in 90d)',
  })
  status: MuscleRecoveryStatus;
}

export class MuscleFrequencyDto {
  @ApiProperty() generatedAt: Date;
  @ApiProperty({
    type: () => [MuscleFrequencyItemDto],
    description: 'Most overdue first',
  })
  muscles: MuscleFrequencyItemDto[];
}

export class BalanceGroupDto {
  @ApiProperty() name: string;
  @ApiProperty() effectiveSets: number;
  @ApiProperty({ description: 'Share of total effective sets (%)' })
  percentage: number;
}

export class TrainingBalanceDto {
  @ApiProperty() period: string;
  @ApiProperty() rangeStart: Date;
  @ApiProperty() rangeEnd: Date;
  @ApiProperty() totalEffectiveSets: number;
  @ApiProperty({ type: () => [BalanceGroupDto] }) byCategory: BalanceGroupDto[];
  @ApiProperty({ type: () => [BalanceGroupDto] }) byRegion: BalanceGroupDto[];
  @ApiProperty({
    description: 'push effective sets / pull effective sets',
    nullable: true,
  })
  pushPullRatio: number | null;
  @ApiProperty({
    description: 'upper effective sets / lower effective sets',
    nullable: true,
  })
  upperLowerRatio: number | null;
  @ApiProperty({
    enum: BalanceInsight,
    isArray: true,
    description:
      'Codes for the app to translate, with pushPullRatio and upperLowerRatio for the figures',
  })
  insights: BalanceInsight[];
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export type ProgressionTrend = 'up' | 'down' | 'flat';

export class SetSnapshotDto {
  @ApiProperty() reps: number;
  @ApiProperty({ description: 'Weight (kg)' }) weight: number;
}

export class ProgressionPointDto {
  @ApiProperty({ example: '2026-05-21', description: 'Calendar day (UTC)' })
  date: string;
  @ApiProperty({
    description: 'Metric value for the day: volume load (kg) or best 1RM (kg)',
  })
  value: number;
  @ApiProperty({ description: 'Weighted sets logged that day' }) sets: number;
  @ApiProperty({
    type: () => SetSnapshotDto,
    description: 'Set with the highest estimated 1RM of the day',
  })
  bestSet: SetSnapshotDto;
  @ApiProperty({ type: [String], description: 'Workouts of that day' })
  workoutIds: string[];
}

export class ProgressionSummaryDto {
  @ApiProperty() points: number;
  @ApiProperty({ type: () => ProgressionPointDto, nullable: true })
  first: ProgressionPointDto | null;
  @ApiProperty({ type: () => ProgressionPointDto, nullable: true })
  latest: ProgressionPointDto | null;
  @ApiProperty({ type: () => ProgressionPointDto, nullable: true })
  best: ProgressionPointDto | null;
  @ApiProperty({ description: 'Latest value minus first value' })
  change: number;
  @ApiProperty({ description: 'Change relative to the first value (%)' })
  changePct: number;
  @ApiProperty({
    enum: ['up', 'down', 'flat'],
    nullable: true,
    description:
      'Average of the latest points against the average of the earliest ' +
      'ones, null when there are fewer than two points',
  })
  trend: ProgressionTrend | null;
}

export class ProgressionExerciseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: DetailedMuscleGroup })
  primaryMuscle: DetailedMuscleGroup;
}

export class ProgressionDto {
  @ApiProperty({ type: () => ProgressionExerciseDto })
  exercise: ProgressionExerciseDto;
  @ApiProperty({ enum: ['volume', '1rm'] }) metric: string;
  @ApiProperty({ enum: ['1m', '3m', '6m', '1y', 'all'] }) period: string;
  @ApiProperty({ nullable: true, description: 'Null for period=all' })
  rangeStart: Date | null;
  @ApiProperty() rangeEnd: Date;
  @ApiProperty({ type: () => ProgressionSummaryDto })
  summary: ProgressionSummaryDto;
  @ApiProperty({
    type: () => [ProgressionPointDto],
    description:
      'One point per training day, oldest first. Only sets with a positive ' +
      'weight and positive reps are counted, so a bodyweight-only exercise ' +
      'returns no points.',
  })
  points: ProgressionPointDto[];
}

// ---------------------------------------------------------------------------
// Personal records
// ---------------------------------------------------------------------------

export class RecordSetDto {
  @ApiProperty({ description: 'Weight (kg)' }) weight: number;
  @ApiProperty() reps: number;
  @ApiProperty({ description: 'First time this was achieved' })
  achievedAt: Date;
}

export class OneRepMaxRecordDto extends RecordSetDto {
  @ApiProperty({ description: 'Estimated 1RM (Epley formula, kg)' })
  value: number;
}

export class SessionVolumeRecordDto {
  @ApiProperty({ description: 'Volume load in one workout (kg)' })
  value: number;
  @ApiProperty() workoutId: string;
  @ApiProperty() achievedAt: Date;
}

export class ExerciseRecordsDto {
  @ApiProperty() exerciseId: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: DetailedMuscleGroup })
  primaryMuscle: DetailedMuscleGroup;
  @ApiProperty({ type: () => OneRepMaxRecordDto })
  estimatedOneRepMax: OneRepMaxRecordDto;
  @ApiProperty({ type: () => RecordSetDto })
  heaviestWeight: RecordSetDto;
  @ApiProperty({ type: () => SessionVolumeRecordDto, nullable: true })
  bestSessionVolume: SessionVolumeRecordDto | null;
}

export class WorkoutRecordDto {
  @ApiProperty() workoutId: string;
  @ApiProperty() title: string;
  @ApiProperty({ description: 'Duration in seconds or volume load in kg' })
  value: number;
  @ApiProperty() achievedAt: Date;
}

export class WorkoutRecordsDto {
  @ApiProperty({
    type: () => WorkoutRecordDto,
    nullable: true,
    description: 'value is the duration in seconds',
  })
  longestWorkout: WorkoutRecordDto | null;
  @ApiProperty({
    type: () => WorkoutRecordDto,
    nullable: true,
    description: 'value is the volume load in kg',
  })
  highestVolumeWorkout: WorkoutRecordDto | null;
  @ApiProperty({ description: 'Longest run of consecutive training days ever' })
  longestStreakDays: number;
  @ApiProperty({ description: 'Distinct days trained, all time' })
  totalTrainingDays: number;
}

export class RecordsDto {
  @ApiProperty() generatedAt: Date;
  @ApiProperty({
    type: () => [ExerciseRecordsDto],
    description: 'Every exercise with a weighted set, best estimated 1RM first',
  })
  exercises: ExerciseRecordsDto[];
  @ApiProperty({ type: () => WorkoutRecordsDto })
  workouts: WorkoutRecordsDto;
}

// ---------------------------------------------------------------------------
// Adherence
// ---------------------------------------------------------------------------

export type AdherenceStatus = 'completed' | 'exceeded' | 'partial' | 'skipped';
export type AdherenceRating = 'full' | 'high' | 'partial' | 'low';

export class AdherenceExerciseDto {
  @ApiProperty() exerciseId: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ['completed', 'exceeded', 'partial', 'skipped'] })
  status: AdherenceStatus;
  @ApiProperty() plannedSets: number;
  @ApiProperty() completedSets: number;
  @ApiProperty() plannedReps: number;
  @ApiProperty() completedReps: number;
  @ApiProperty({ description: 'Planned volume load (kg)' })
  plannedVolume: number;
  @ApiProperty({ description: 'Volume load actually done (kg)' })
  completedVolume: number;
  @ApiProperty({
    description:
      'Planned sets that were done, capped at 100, extra sets do not count',
  })
  setAdherencePct: number;
  @ApiProperty({
    nullable: true,
    description: 'Done volume over planned volume (%), null without a plan',
  })
  volumeAdherencePct: number | null;
}

export class AdherenceExtraExerciseDto {
  @ApiProperty() exerciseId: string;
  @ApiProperty() name: string;
  @ApiProperty() sets: number;
  @ApiProperty() reps: number;
  @ApiProperty() volume: number;
}

export class AdherenceTotalsDto {
  @ApiProperty() exercisesPlanned: number;
  @ApiProperty({ description: 'Completed or exceeded' })
  exercisesCompleted: number;
  @ApiProperty() exercisesPartial: number;
  @ApiProperty() exercisesSkipped: number;
  @ApiProperty({ description: 'Done but not in the plan' })
  extraExercises: number;
  @ApiProperty() setsPlanned: number;
  @ApiProperty({ description: 'Planned sets done, extra sets excluded' })
  setsCompleted: number;
  @ApiProperty() volumePlanned: number;
  @ApiProperty({
    description: 'Volume of the planned exercises, may exceed the plan',
  })
  volumeCompleted: number;
}

export class AdherenceDto {
  @ApiProperty() completedWorkoutId: string;
  @ApiProperty() plannedWorkoutId: string;
  @ApiProperty() completedTitle: string;
  @ApiProperty() plannedTitle: string;
  @ApiProperty({
    nullable: true,
    description:
      'Share of planned sets done (0 to 100). Falls back to the share of ' +
      'planned exercises done when the plan has no sets, null for an empty plan.',
  })
  score: number | null;
  @ApiProperty({
    enum: ['full', 'high', 'partial', 'low'],
    nullable: true,
    description: 'full at 100, high from 80, partial from 50, else low',
  })
  rating: AdherenceRating | null;
  @ApiProperty({ type: () => AdherenceTotalsDto })
  totals: AdherenceTotalsDto;
  @ApiProperty({
    type: () => [AdherenceExerciseDto],
    description: 'In the order of the plan',
  })
  exercises: AdherenceExerciseDto[];
  @ApiProperty({ type: () => [AdherenceExtraExerciseDto] })
  extras: AdherenceExtraExerciseDto[];
}

// ---------------------------------------------------------------------------
// Comparison against the personal baseline
// ---------------------------------------------------------------------------

export type ComparisonVerdict = 'above' | 'below' | 'on_track' | 'unknown';

export class ComparedTotalsDto {
  @ApiProperty() workouts: number;
  @ApiProperty() durationSeconds: number;
  @ApiProperty() sets: number;
  @ApiProperty() reps: number;
  @ApiProperty({ description: 'Volume load (kg)' }) volume: number;
  @ApiProperty() calories: number;
}

export class MetricComparisonDto {
  @ApiProperty({ description: 'Value so far in the current period' })
  current: number;
  @ApiProperty({
    nullable: true,
    description: 'Average of a full baseline period, null without history',
  })
  baselineAverage: number | null;
  @ApiProperty({
    nullable: true,
    description:
      'Baseline average pro-rated by the elapsed share of the current period',
  })
  expectedByNow: number | null;
  @ApiProperty({
    nullable: true,
    description: 'Current against expectedByNow (%), null without history',
  })
  changePct: number | null;
  @ApiProperty({ enum: ['above', 'below', 'on_track', 'unknown'] })
  verdict: ComparisonVerdict;
}

export class BaselineDto {
  @ApiProperty({ description: 'Full periods averaged' })
  periodsConsidered: number;
  @ApiProperty() rangeStart: Date;
  @ApiProperty() rangeEnd: Date;
  @ApiProperty({ type: () => ComparedTotalsDto })
  average: ComparedTotalsDto;
}

export class ComparisonsDto {
  @ApiProperty() period: string;
  @ApiProperty() rangeStart: Date;
  @ApiProperty() rangeEnd: Date;
  @ApiProperty({ description: 'Share of the current period already elapsed' })
  elapsedPct: number;
  @ApiProperty({ type: () => ComparedTotalsDto })
  current: ComparedTotalsDto;
  @ApiProperty({
    type: () => BaselineDto,
    nullable: true,
    description:
      'Null when the user has no full period of history before the current one',
  })
  baseline: BaselineDto | null;
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'object' },
    description:
      'Per metric: workouts, durationSeconds, sets, reps, volume, calories',
  })
  comparison: Record<string, MetricComparisonDto>;
  @ApiProperty({
    enum: ComparisonInsight,
    isArray: true,
    description:
      'Codes for the app to translate, with comparison[metric].changePct and baseline.periodsConsidered for the figures',
  })
  insights: ComparisonInsight[];
}

// ---------------------------------------------------------------------------
// Workout type breakdown
// ---------------------------------------------------------------------------

export class TypeSliceDto {
  @ApiProperty({ description: 'exercise_type or equipment_type value' })
  type: string;
  @ApiProperty({ description: 'Distinct exercises of that type' })
  exercises: number;
  @ApiProperty() sets: number;
  @ApiProperty({ description: 'Volume load (kg)' }) volume: number;
  @ApiProperty({ description: 'Share of all sets in the period (%)' })
  percentageOfSets: number;
}

export class WorkoutTypeBreakdownDto {
  @ApiProperty() period: string;
  @ApiProperty() rangeStart: Date;
  @ApiProperty() rangeEnd: Date;
  @ApiProperty() totalSets: number;
  @ApiProperty({ type: () => [TypeSliceDto] })
  byExerciseType: TypeSliceDto[];
  @ApiProperty({ type: () => [TypeSliceDto] })
  byEquipmentType: TypeSliceDto[];
}

// ---------------------------------------------------------------------------
// Heatmap
// ---------------------------------------------------------------------------

export class HeatmapDayDto {
  @ApiProperty({ example: '2026-05-21', description: 'Calendar day (UTC)' })
  date: string;
  @ApiProperty() workouts: number;
  @ApiProperty() durationSeconds: number;
  @ApiProperty({
    description:
      'Estimated kcal of the day, workout by workout as GET /stats/workout/:id',
  })
  calories: number;
  @ApiProperty({
    description:
      'Intensity from 1 to maxLevel, relative to the longest day of the year',
  })
  level: number;
}

export class HeatmapDto {
  @ApiProperty() year: number;
  @ApiProperty() totalWorkouts: number;
  @ApiProperty() activeDays: number;
  @ApiProperty() totalDurationSeconds: number;
  @ApiProperty({ description: 'Estimated kcal of the year' })
  totalCalories: number;
  @ApiProperty() maxWorkoutsInDay: number;
  @ApiProperty({ description: 'Longest run of consecutive days in the year' })
  longestStreakDays: number;
  @ApiProperty() maxLevel: number;
  @ApiProperty({
    type: () => [HeatmapDayDto],
    description: 'Only days with at least one workout, oldest first',
  })
  days: HeatmapDayDto[];
}
