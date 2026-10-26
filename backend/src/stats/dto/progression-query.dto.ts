import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum ProgressionMetric {
  VOLUME = 'volume',
  ONE_REP_MAX = '1rm',
}

export enum ProgressionPeriod {
  ONE_MONTH = '1m',
  THREE_MONTHS = '3m',
  SIX_MONTHS = '6m',
  ONE_YEAR = '1y',
  ALL = 'all',
}

export class ProgressionQueryDto {
  @ApiProperty({ description: 'Exercise whose progression is returned' })
  @IsUUID()
  exerciseId: string;

  @ApiPropertyOptional({
    enum: ProgressionMetric,
    default: ProgressionMetric.VOLUME,
    description:
      'volume is the sum of reps x weight in the day, 1rm is the best ' +
      'estimated one-rep max (Epley) of the day',
  })
  @IsOptional()
  @IsEnum(ProgressionMetric)
  metric: ProgressionMetric = ProgressionMetric.VOLUME;

  @ApiPropertyOptional({
    enum: ProgressionPeriod,
    default: ProgressionPeriod.THREE_MONTHS,
    description: 'How far back the series goes',
  })
  @IsOptional()
  @IsEnum(ProgressionPeriod)
  period: ProgressionPeriod = ProgressionPeriod.THREE_MONTHS;
}
