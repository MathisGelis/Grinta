import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AdherenceQueryDto {
  @ApiProperty({ description: 'Completed workout, must belong to the caller' })
  @IsUUID()
  completedWorkoutId: string;

  @ApiProperty({ description: 'Planned workout the session is compared to' })
  @IsUUID()
  plannedWorkoutId: string;
}
