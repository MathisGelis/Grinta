import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { EquipmentType } from '../enums/equipment-type.enum';
import { DetailedMuscleGroup } from '../enums/detailed-muscle.enum';
import { ExerciseType } from '../enums/exercise-type.enum';

export class CreateExerciseDto {
  @ApiProperty({ example: 'Barbell Bench Press' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ enum: EquipmentType })
  @IsEnum(EquipmentType)
  equipment_type: EquipmentType;

  @ApiProperty({ enum: DetailedMuscleGroup })
  @IsEnum(DetailedMuscleGroup)
  primary_muscle: DetailedMuscleGroup;

  @ApiProperty({ enum: DetailedMuscleGroup, required: false })
  @IsOptional()
  @IsEnum(DetailedMuscleGroup)
  secondary_muscle?: DetailedMuscleGroup;

  @ApiProperty({ enum: ExerciseType })
  @IsEnum(ExerciseType)
  exercise_type: ExerciseType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image_url?: string;
}
