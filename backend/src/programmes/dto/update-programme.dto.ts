import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty } from '../enums/difficulty.enum';
import { LocationType } from '../enums/location-type.enum';
import { ProgrammeDayDto } from './create-programme.dto';
import { MAX_PROGRAMME_DAYS } from '../utils/programme-limits';

export class UpdateProgrammeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weekNumber?: number;

  @ApiPropertyOptional({ enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({ enum: LocationType })
  @IsOptional()
  @IsEnum(LocationType)
  locationType?: LocationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [ProgrammeDayDto],
    minItems: 1,
    maxItems: MAX_PROGRAMME_DAYS,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PROGRAMME_DAYS)
  @ValidateNested({ each: true })
  @Type(() => ProgrammeDayDto)
  days?: ProgrammeDayDto[];
}
