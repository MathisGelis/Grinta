import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength, IsUUID, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PlannedSetDto {
  @ApiProperty({ example: 8, required: false })
  @IsOptional()
  @IsInt()
  reps?: number;

  @ApiProperty({ example: 80, required: false })
  @IsOptional()
  weight?: number;
}

class PlannedExerciseDto {
  @ApiProperty({ example: 'uuid-of-exercise' })
  @IsUUID()
  exerciseId: string;

  @ApiProperty({ example: 90, required: false })
  @IsOptional()
  @IsInt()
  rest_seconds?: number;

  @ApiProperty({
    type: [PlannedSetDto],
    required: false,
    example: [{ reps: 8, weight: 80 }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlannedSetDto)
  planned_sets?: PlannedSetDto[];
}

export class CreateWorkoutPlannedDto {
  @ApiProperty({ example: 'Push Day' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [PlannedExerciseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlannedExerciseDto)
  exercises: PlannedExerciseDto[];
}
