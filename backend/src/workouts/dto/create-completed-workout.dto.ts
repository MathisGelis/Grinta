import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
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
import { SetPairDto } from './set-pair.dto';
import {
  IsNotFarInFuture,
  trimmed,
  WORKOUT_LIMITS as LIMITS,
} from './workout-limits';

export class CompletedWorkoutExerciseDto {
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
  timerSeconds?: number;
}

export class CreateCompletedWorkoutDto {
  @ApiProperty({ minLength: 1, maxLength: LIMITS.titleMax })
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(LIMITS.titleMax)
  title: string;

  @ApiProperty({
    description: `ISO date, at most ${LIMITS.completionMaxHoursAhead} h ahead of now`,
  })
  @IsDateString()
  @IsNotFarInFuture(LIMITS.completionMaxHoursAhead)
  completionDate: string;

  @ApiProperty({ minimum: 1, maximum: LIMITS.durationMaxSeconds })
  @IsInt()
  @Min(1)
  @Max(LIMITS.durationMaxSeconds)
  totalDurationSeconds: number;

  @ApiProperty({ required: false, maxLength: LIMITS.descriptionMax })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @MaxLength(LIMITS.descriptionMax)
  description?: string;

  @ApiProperty({
    type: [CompletedWorkoutExerciseDto],
    minItems: 1,
    maxItems: LIMITS.exercisesMax,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LIMITS.exercisesMax)
  @ValidateNested({ each: true })
  @Type(() => CompletedWorkoutExerciseDto)
  exercises: CompletedWorkoutExerciseDto[];
}
