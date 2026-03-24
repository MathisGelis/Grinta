import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SetPairDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  reps: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  weight: number;
}

export class CompletedWorkoutExerciseDto {
  @ApiProperty()
  @IsUUID()
  exerciseId: string;

  @ApiProperty({ type: [SetPairDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetPairDto)
  sets?: SetPairDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  timerSeconds?: number;
}

export class CreateCompletedWorkoutDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsDateString()
  completionDate: string;

  @ApiProperty()
  @IsInt()
  totalDurationSeconds: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [CompletedWorkoutExerciseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletedWorkoutExerciseDto)
  exercises: CompletedWorkoutExerciseDto[];
}
