import { ApiProperty } from '@nestjs/swagger';
import { DetailedMuscleGroup } from '../../exercise/enums/detailed-muscle.enum';

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
    type: [String],
    description: 'Human-readable balance insights',
  })
  insights: string[];
}
