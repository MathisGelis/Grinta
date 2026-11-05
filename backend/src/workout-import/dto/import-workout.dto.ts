import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export const MAX_IMPORT_LENGTH = 10_000;

export class ImportWorkoutDto {
  @ApiProperty({
    example:
      'Lundi : Push\ndc 4x8 60kg\ndips 3x10\nMardi : Pull\ntractions 4x6',
    description: `Workout notes, French or English, up to ${MAX_IMPORT_LENGTH} characters`,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_IMPORT_LENGTH)
  text: string;
}
