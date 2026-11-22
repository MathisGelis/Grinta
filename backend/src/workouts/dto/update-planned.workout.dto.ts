import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PlannedWorkoutExerciseDto } from './create-planned-workout.dto';
import { trimmed, WORKOUT_LIMITS as LIMITS } from './workout-limits';

export class UpdatePlannedWorkoutDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: LIMITS.titleMax })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(LIMITS.titleMax)
  title?: string;

  @ApiPropertyOptional({ maxLength: LIMITS.descriptionMax })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(LIMITS.descriptionMax)
  description?: string;

  @ApiPropertyOptional({
    type: [PlannedWorkoutExerciseDto],
    minItems: 1,
    maxItems: LIMITS.exercisesMax,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LIMITS.exercisesMax)
  @ValidateNested({ each: true })
  @Type(() => PlannedWorkoutExerciseDto)
  exercises?: PlannedWorkoutExerciseDto[];

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 600,
    nullable: true,
    description: 'Expected duration in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  estimatedDurationMinutes?: number | null;
}
