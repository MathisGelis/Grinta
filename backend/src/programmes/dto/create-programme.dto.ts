import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Difficulty } from '../enums/difficulty.enum';
import { LocationType } from '../enums/location-type.enum';
import { Transform, Type } from 'class-transformer';
import { MAX_PROGRAMME_DAYS } from '../utils/programme-limits';

export class ProgrammeDayDto {
  @ApiProperty({
    example: 1,
    description: `Position of the day in the programme, 1 to ${MAX_PROGRAMME_DAYS}. The days of a programme are numbered 1 to N with no gap and no duplicate`,
    maximum: MAX_PROGRAMME_DAYS,
  })
  @IsInt()
  @Min(1)
  @Max(MAX_PROGRAMME_DAYS)
  dayNumber: number;

  @ApiPropertyOptional({
    description: 'Planned workout for this day. Omit for a rest day.',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUUID()
  workoutId?: string;
}

export class CreateProgrammeDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  weekNumber: number;

  @ApiProperty({ enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ enum: LocationType })
  @IsEnum(LocationType)
  locationType: LocationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: () => [ProgrammeDayDto], maxItems: MAX_PROGRAMME_DAYS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PROGRAMME_DAYS)
  @ValidateNested({ each: true })
  @Type(() => ProgrammeDayDto)
  days: ProgrammeDayDto[];
}
