import { ApiProperty } from '@nestjs/swagger';
import { DetailedMuscleGroup } from '../enums/detailed-muscle.enum';

export class SetSummaryDto {
  @ApiProperty() reps: number;
  @ApiProperty({ description: 'Weight (kg), 0 for a bodyweight set' })
  weight: number;
}

export class ExerciseStatsDto {
  @ApiProperty() exerciseId: string;
  @ApiProperty() exerciseName: string;
  @ApiProperty({ enum: DetailedMuscleGroup })
  primaryMuscle: DetailedMuscleGroup;

  @ApiProperty({ description: 'Completion date of the most recent session' })
  lastPerformedAt: Date | null;
  @ApiProperty({
    nullable: true,
    description: 'Top set of the most recent session: heaviest, then most reps',
  })
  lastWeight: number | null;
  @ApiProperty({ nullable: true }) lastReps: number | null;
  @ApiProperty({
    type: () => [SetSummaryDto],
    description: 'Every set of the most recent session, in order',
  })
  lastSets: SetSummaryDto[];

  @ApiProperty({
    nullable: true,
    description: 'Heaviest weight ever lifted in a set (kg)',
  })
  prWeight: number | null;
  @ApiProperty({ nullable: true, description: 'Most reps done at prWeight' })
  prReps: number | null;
  @ApiProperty({ nullable: true, description: 'Epley formula (kg)' })
  bestEstimatedOneRepMax: number | null;
  @ApiProperty({
    nullable: true,
    description: 'Highest reps x weight total in one workout (kg)',
  })
  bestSessionVolume: number | null;
  @ApiProperty({
    nullable: true,
    description: 'Most reps in a set without added weight',
  })
  maxReps: number | null;

  @ApiProperty() totalSessions: number;
  @ApiProperty() totalSets: number;
  @ApiProperty() totalReps: number;
  @ApiProperty({ description: 'Volume load over all sessions (kg)' })
  totalVolume: number;
  @ApiProperty() updatedAt: Date;
}
