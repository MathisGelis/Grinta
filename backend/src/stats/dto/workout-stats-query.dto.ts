import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class WorkoutStatsQueryDto {
  @ApiPropertyOptional({
    description:
      'Optional body weight (kg) override for calorie estimation. ' +
      'If omitted, the value is read from the user profile, then falls back to a default.',
    example: 75,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  bodyWeightKg?: number;
}
