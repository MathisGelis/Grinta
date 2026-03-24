import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty } from '../enums/difficulty.enum';
import { LocationType } from '../enums/location-type.enum';
import { WeekDay } from '../entities/programme-day.entity';

export class ProgrammeDayDto {
  @ApiProperty({ enum: WeekDay })
  @IsEnum(WeekDay)
  weekday: WeekDay;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workoutId?: string;
}

export class CreateProgrammeDto {
  @ApiProperty()
  @IsNumber()
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

  @ApiProperty({ type: [ProgrammeDayDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgrammeDayDto)
  days: ProgrammeDayDto[];
}
