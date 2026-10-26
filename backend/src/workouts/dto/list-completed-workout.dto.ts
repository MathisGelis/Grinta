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

  @ApiProperty({ type: String, nullable: true })
  photoUrl: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Use this one in the list, photoUrl on the workout screen',
  })
  photoThumbnailUrl: string | null;
}
