import { ApiProperty } from '@nestjs/swagger';
import { Difficulty } from '../enums/difficulty.enum';

export class ProgrammeListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ description: 'Total number of days, rest days included' })
  totalDays: number;

  @ApiProperty({
    description: 'Days with a workout planned (excludes rest days)',
  })
  workoutDays: number;

  @ApiProperty({ enum: Difficulty })
  difficulty: Difficulty;
}
