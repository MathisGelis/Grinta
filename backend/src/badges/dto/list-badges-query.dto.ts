import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { BadgeType } from '../enums/badge-type.enum';

export class ListBadgesQueryDto {
  @ApiPropertyOptional({ description: 'Only the badges of this exercise' })
  @IsOptional()
  @IsUUID()
  exerciseId?: string;

  @ApiPropertyOptional({ enum: BadgeType })
  @IsOptional()
  @IsEnum(BadgeType)
  type?: BadgeType;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
