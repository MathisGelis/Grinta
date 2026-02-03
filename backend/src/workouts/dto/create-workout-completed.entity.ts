import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, MinLength, IsUUID, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CompletedSetDto {
  @ApiProperty({ example: 8 })
  @IsInt()
  reps: number;

  @ApiProperty({ example: 80 })
  weight: number;

  @ApiProperty({ example: 90, required: false })
  @IsInt()
  rest_seconds?: number;
}

class CompletedExerciseDto {
  @ApiProperty({ example: 'uuid-of-exercise' })
  @IsUUID()
  exerciseId: string;

  @ApiProperty({ type: [CompletedSetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletedSetDto)
  sets: CompletedSetDto[];
}

export class CreateWorkoutCompletedDto {
  @ApiProperty({ example: 'Push Day' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 3600 })
  @IsInt()
  total_duration_seconds: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ type: [CompletedExerciseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletedExerciseDto)
  exercises: CompletedExerciseDto[];
}
