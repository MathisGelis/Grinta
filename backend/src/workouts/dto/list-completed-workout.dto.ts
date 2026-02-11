import { ApiProperty } from '@nestjs/swagger';

export class CompletedWorkoutListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  completionDate: Date;

  @ApiProperty()
  totalDurationSeconds: number;

  @ApiProperty()
  totalExercises: number;
}
