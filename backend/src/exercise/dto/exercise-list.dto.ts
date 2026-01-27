import { ApiProperty } from '@nestjs/swagger';
import { EquipmentType } from '../enums/equipment-type.enum';

export class ExerciseListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: EquipmentType })
  equipment_type: EquipmentType;

  @ApiProperty({ required: false })
  image_url?: string;
}
