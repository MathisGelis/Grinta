import { ApiProperty } from '@nestjs/swagger';
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
}
