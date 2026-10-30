import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

/** Heaviest weight a set can log, in kg. Above it, the input is a typo. */
export const MAX_SET_WEIGHT_KG = 1000;

/**
 * One set: reps, and the weight in kg, 0 for bodyweight. Weights take up to
 * two decimals (62.5 kg, 1.25 kg plates); reps stay whole.
 */
export class SetPairDto {
  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(1)
  reps: number;

  @ApiProperty({
    example: 62.5,
    minimum: 0,
    maximum: MAX_SET_WEIGHT_KG,
    description: 'kg, up to two decimals, 0 for bodyweight',
  })
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_SET_WEIGHT_KG)
  weight: number;
}
