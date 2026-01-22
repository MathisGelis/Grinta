import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserExerciseStatsDto {
  @ApiProperty({ required: false })
  PR?: number;

  @ApiProperty({ required: false })
  last_reps?: number;

  @ApiProperty({ required: false })
  last_weight?: number;
}
