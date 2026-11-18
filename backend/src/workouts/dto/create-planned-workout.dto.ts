import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SetPairDto } from './set-pair.dto';
import { trimmed, WORKOUT_LIMITS as LIMITS } from './workout-limits';

export class PlannedWorkoutExerciseDto {
  @ApiProperty()
  @IsUUID()
  exerciseId: string;

  @ApiProperty({
    type: [SetPairDto],
    required: false,
    minItems: 1,
    maxItems: LIMITS.setsMax,
    description: 'Omit it for an exercise without sets, never send []',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LIMITS.setsMax)
  @ValidateNested({ each: true })
  @Type(() => SetPairDto)
  sets?: SetPairDto[];

  @ApiProperty({
    required: false,
    minimum: 0,
    maximum: LIMITS.timerMaxSeconds,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(LIMITS.timerMaxSeconds)
  plannedRestSeconds?: number;
}

export class CreatePlannedWorkoutDto {
  @ApiProperty({ minLength: 1, maxLength: LIMITS.titleMax })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(LIMITS.titleMax)
  title: string;

  @ApiProperty({ required: false, maxLength: LIMITS.descriptionMax })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(LIMITS.descriptionMax)
  description?: string;

  @ApiProperty({
    type: [PlannedWorkoutExerciseDto],
    minItems: 1,
    maxItems: LIMITS.exercisesMax,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LIMITS.exercisesMax)
  @ValidateNested({ each: true })
  @Type(() => PlannedWorkoutExerciseDto)
  exercises: PlannedWorkoutExerciseDto[];

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
