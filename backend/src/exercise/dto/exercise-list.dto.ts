import { ApiProperty } from '@nestjs/swagger';
import { DetailedMuscleGroup } from '../enums/detailed-muscle.enum';
import { EquipmentType } from '../enums/equipment-type.enum';
import { ExerciseType } from '../enums/exercise-type.enum';

/** One item of GET /exercises: no description, instructions or image_urls. */
export class ExerciseListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: EquipmentType })
  equipment_type: EquipmentType;

  @ApiProperty({ enum: DetailedMuscleGroup })
  primary_muscle: DetailedMuscleGroup;

  @ApiProperty({ enum: DetailedMuscleGroup, isArray: true, nullable: true })
  secondary_muscles: DetailedMuscleGroup[] | null;

  @ApiProperty({ enum: ExerciseType })
  exercise_type: ExerciseType;

  @ApiProperty({
    required: false,
    description: 'Thumbnail URL, empty when the exercise has no picture',
  })
  image_url?: string;

  @ApiProperty()
  createdAt: Date;
}

/** GET /exercises/:id: the list fields plus how to perform the exercise. */
export class ExerciseDetailDto extends ExerciseListDto {
  @ApiProperty({ nullable: true }) description: string | null;

  @ApiProperty({
    type: [String],
    nullable: true,
    description: 'One step per item, in order',
  })
  instructions: string[] | null;

  @ApiProperty({
    type: [String],
    nullable: true,
    description:
      'Start and end position photos (public domain, free-exercise-db). Alternate them to animate the movement.',
  })
  image_urls: string[] | null;
}
