import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GroupActivityQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description:
      '`at` of the last event of the previous page: returns the older ones',
    example: '2026-10-29T18:05:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  before?: Date;
}
