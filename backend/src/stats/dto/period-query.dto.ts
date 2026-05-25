import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum StatsPeriod {
  WEEK = 'week',
  MONTH = 'month',
}

export class PeriodQueryDto {
  @ApiProperty({ enum: StatsPeriod, description: 'Window' })
  @IsEnum(StatsPeriod)
  period: StatsPeriod;

  @ApiPropertyOptional({
    description: 'Week/month containing this date is used. Defaults to today.',
    example: '2026-05-21',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
