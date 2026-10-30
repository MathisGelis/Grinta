import { ApiProperty } from '@nestjs/swagger';

export class PlannedWorkoutListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  totalExercises: number;

  @ApiProperty({ description: 'Planned sets of all its exercises' })
  totalSets: number;

  @ApiProperty({ nullable: true, description: 'Expected duration, minutes' })
  estimatedDurationMinutes: number | null;
}
