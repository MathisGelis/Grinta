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
} from 'class-validator';
import { Type } from 'class-transformer';
import { SetPairDto } from './set-pair.dto';

export class PlannedWorkoutExerciseDto {
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
  plannedRestSeconds?: number;
}

export class UpdatePlannedWorkoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [PlannedWorkoutExerciseDto] })
  @IsOptional()
  @IsArray()
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
