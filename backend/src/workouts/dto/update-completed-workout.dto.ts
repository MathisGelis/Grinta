import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CompletedWorkoutExerciseDto } from './create-completed-workout.dto';
import {
  IsNotFarInFuture,
  trimmed,
  WORKOUT_LIMITS as LIMITS,
} from './workout-limits';

export class UpdateCompletedWorkoutDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: LIMITS.titleMax })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(LIMITS.titleMax)
  title?: string;

  @ApiPropertyOptional({
    description: `ISO date, at most ${LIMITS.completionMaxHoursAhead} h ahead of now`,
  })
  @IsOptional()
  @IsDateString()
  @IsNotFarInFuture(LIMITS.completionMaxHoursAhead)
  completionDate?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: LIMITS.durationMaxSeconds })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(LIMITS.durationMaxSeconds)
  totalDurationSeconds?: number;

  @ApiPropertyOptional({ maxLength: LIMITS.descriptionMax })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(LIMITS.descriptionMax)
  description?: string;

  @ApiPropertyOptional({
    type: [CompletedWorkoutExerciseDto],
    minItems: 1,
    maxItems: LIMITS.exercisesMax,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LIMITS.exercisesMax)
  @ValidateNested({ each: true })
  @Type(() => CompletedWorkoutExerciseDto)
  exercises?: CompletedWorkoutExerciseDto[];
}
