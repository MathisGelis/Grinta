import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  plannedRestSeconds?: number;
}

export class CreatePlannedWorkoutDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [PlannedWorkoutExerciseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlannedWorkoutExerciseDto)
  exercises: PlannedWorkoutExerciseDto[];
}
