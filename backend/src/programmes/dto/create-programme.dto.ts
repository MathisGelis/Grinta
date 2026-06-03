import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Difficulty } from '../enums/difficulty.enum';
import { LocationType } from '../enums/location-type.enum';
import { Transform, Type } from 'class-transformer';

export class ProgrammeDayDto {
  @ApiProperty({ example: 1, description: 'Position of the day in the programme (>= 1)' })
  @IsInt()
  @Min(1)
  dayNumber: number;

  @ApiPropertyOptional({ description: 'Planned workout for this day. Omit for a rest day.' })
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

  @ApiProperty({ type: () => [ProgrammeDayDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProgrammeDayDto)
  days: ProgrammeDayDto[];
}
