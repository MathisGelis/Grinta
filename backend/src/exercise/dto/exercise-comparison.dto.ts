import { ApiProperty } from '@nestjs/swagger';

/** The figures compared side by side, for one person and one exercise. */
export class ComparedExerciseStatsDto {
  @ApiProperty({ nullable: true, description: 'Heaviest set weight (kg)' })
  heaviestWeight: number | null;
  @ApiProperty({ nullable: true, description: 'Best estimated 1RM (kg)' })
  estimatedOneRepMax: number | null;
  @ApiProperty({
    nullable: true,
    description: 'Best reps x weight of a session (kg)',
  })
  bestSessionVolume: number | null;
  @ApiProperty({ nullable: true, description: 'Most reps in a bodyweight set' })
  maxReps: number | null;
  @ApiProperty() totalSessions: number;
  @ApiProperty() lastPerformedAt: Date;
}

export class ComparedUserDto {
  @ApiProperty() id: string;
  @ApiProperty() uniqueName: string;
  @ApiProperty() displayName: string;
  @ApiProperty({ nullable: true }) avatarThumbnailUrl: string | null;
}

export class ExerciseComparisonDto {
  @ApiProperty({ example: { id: 'uuid', name: 'Bench Press (Barbell)' } })
  exercise: { id: string; name: string };
  @ApiProperty({
    type: () => ComparedExerciseStatsDto,
    nullable: true,
    description:
      'The current user, from all their workouts. Null if never done',
  })
  me: ComparedExerciseStatsDto | null;
  @ApiProperty({ type: () => ComparedUserDto })
  user: ComparedUserDto;
  @ApiProperty({
    type: () => ComparedExerciseStatsDto,
    nullable: true,
    description:
      'The other user, from their published workouts only. Null if none of them has the exercise',
  })
  them: ComparedExerciseStatsDto | null;
}
