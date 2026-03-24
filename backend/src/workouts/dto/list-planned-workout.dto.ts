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
}
