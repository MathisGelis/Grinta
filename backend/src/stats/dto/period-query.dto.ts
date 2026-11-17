import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

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

const USER_ID_DESCRIPTION =
  'Another user whose stats to read. Allowed when their profile is public ' +
  'or you follow them, otherwise 404. Only their published workouts count, ' +
  'and calories use the default body weight (70 kg).';

export class StatsSubjectQueryDto {
  @ApiPropertyOptional({ description: USER_ID_DESCRIPTION, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class SubjectPeriodQueryDto extends PeriodQueryDto {
  @ApiPropertyOptional({ description: USER_ID_DESCRIPTION, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
