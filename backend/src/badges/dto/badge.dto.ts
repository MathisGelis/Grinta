import { ApiProperty } from '@nestjs/swagger';
import { RealLifeComparisonDto } from '../../common/dto/real-life-comparison.dto';
import { BadgeType } from '../enums/badge-type.enum';

export class BadgeExerciseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class BadgeDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: BadgeType }) type: BadgeType;
  @ApiProperty({ type: () => BadgeExerciseDto }) exercise: BadgeExerciseDto;
  @ApiProperty({ description: 'Completed workout that set the record' })
  workoutId: string;
  @ApiProperty({ enum: ['kg', 'reps'], description: 'Unit of value' })
  unit: 'kg' | 'reps';
  @ApiProperty({ description: 'The new record' }) value: number;
  @ApiProperty({ description: 'The record it beat' }) previousValue: number;
  @ApiProperty({ description: 'value - previousValue' }) improvement: number;
  @ApiProperty({ description: 'Improvement relative to previousValue (%)' })
  improvementPct: number;
  @ApiProperty({
    nullable: true,
    description:
      'Weight of the set behind the record, null for a volume record',
  })
  weight: number | null;
  @ApiProperty({ nullable: true }) reps: number | null;
  @ApiProperty({ description: 'Completion date of the workout' })
  achievedAt: Date;
  @ApiProperty({
    type: () => RealLifeComparisonDto,
    nullable: true,
    description:
      'The weight lifted told as everyday objects: the heaviest weight for heaviest_weight, the session volume for best_session_volume. Null for the other records, which are not a weight actually lifted (estimated 1RM, reps), and under 7 kg',
  })
  realLifeComparison: RealLifeComparisonDto | null;
}
