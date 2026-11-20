import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Matches, Min } from 'class-validator';

const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'La date doit être au format AAAA-MM-JJ.';

export class StartProgrammeDto {
  @ApiPropertyOptional({
    example: '2026-10-30',
    description:
      "Day 1 of the programme, in the user's calendar. Defaults to today (UTC): send the local date so that a start after midnight UTC lands on the right day",
  })
  @IsOptional()
  @Matches(CALENDAR_DATE, { message: MESSAGE })
  @IsDateString({}, { message: MESSAGE })
  startDate?: string;

  @ApiPropertyOptional({
    example: 3,
    minimum: 1,
    default: 1,
    description:
      'The day of the programme `startDate` is, to start midway: 3 makes the start date day 3. At most the last day of the programme',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  startDay?: number;
}

export class ProgrammeDayQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-30',
    description:
      "The day to suggest a workout for, in the user's calendar. Defaults to today (UTC): send the local date",
  })
  @IsOptional()
  @Matches(CALENDAR_DATE, { message: MESSAGE })
  @IsDateString({}, { message: MESSAGE })
  date?: string;
}
