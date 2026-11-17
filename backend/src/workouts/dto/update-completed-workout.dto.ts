import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SetPairDto } from './set-pair.dto';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  timerSeconds?: number;
}

export class UpdateCompletedWorkoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  totalDurationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [CompletedWorkoutExerciseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletedWorkoutExerciseDto)
  exercises?: CompletedWorkoutExerciseDto[];
}
