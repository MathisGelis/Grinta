import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Goal } from '../../users/enums/goal.enum';
import { TrainingLevel } from '../../users/enums/level.enum';
import { TrainingLocation } from '../../users/enums/training-location.enum';

/** Each answer defaults to the one stored on the caller's profile. */
export class TemplatesQueryDto {
  @ApiPropertyOptional({ enum: Goal })
  @IsOptional()
  @IsEnum(Goal)
  goal?: Goal;

  @ApiPropertyOptional({ enum: TrainingLevel })
  @IsOptional()
  @IsEnum(TrainingLevel)
  level?: TrainingLevel;

  @ApiPropertyOptional({ minimum: 1, maximum: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  daysPerWeek?: number;

  @ApiPropertyOptional({ enum: TrainingLocation })
  @IsOptional()
  @IsEnum(TrainingLocation)
  location?: TrainingLocation;
}
