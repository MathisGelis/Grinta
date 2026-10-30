import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { StatsPeriod } from '../../stats/dto/period-query.dto';

export class WorkoutSuggestionQueryDto {
  @ApiPropertyOptional({
    enum: StatsPeriod,
    default: StatsPeriod.WEEK,
    description: 'Period over which trained muscles are counted',
  })
  @IsOptional()
  @IsEnum(StatsPeriod)
  period?: StatsPeriod;

  @ApiPropertyOptional({
    example: '2026-10-30',
    description: 'The week or month containing this date. Defaults to today',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
