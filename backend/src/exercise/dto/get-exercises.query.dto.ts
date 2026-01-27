import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EquipmentType } from '../enums/equipment-type.enum';

export class GetExercisesQueryDto {
  @ApiPropertyOptional({ enum: EquipmentType })
  @IsOptional()
  @IsEnum(EquipmentType)
  equipmentType?: EquipmentType;

  @ApiPropertyOptional({
    description: 'Comma-separated muscle groups',
    example: 'middle_chest,triceps',
  })
  @IsOptional()
  @IsString()
  primaryMuscles?: string;
}
