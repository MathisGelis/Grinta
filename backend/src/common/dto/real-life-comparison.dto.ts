import { ApiProperty } from '@nestjs/swagger';
import { REAL_LIFE_OBJECTS } from '../utils/real-life-comparison';
import type { RealLifeObject } from '../utils/real-life-comparison';

export class RealLifeComparisonDto {
  @ApiProperty({
    enum: REAL_LIFE_OBJECTS,
    description: 'English key of the object, translated by the app',
  })
  object: RealLifeObject;

  @ApiProperty({
    description: 'How many of them the load weighs, 1 or more, one decimal',
    example: 3.2,
  })
  count: number;
}
