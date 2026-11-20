import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListCompletedWorkoutsQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    description:
      'Page size. Without it the whole history is returned, as before.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Id of the last workout of the previous page: returns the ones after it, in the same order',
  })
  @IsOptional()
  @IsUUID()
  before?: string;
}
