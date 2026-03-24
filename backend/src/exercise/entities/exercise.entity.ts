import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  OneToMany,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EquipmentType } from '../enums/equipment-type.enum';
import { DetailedMuscleGroup } from '../enums/detailed-muscle.enum';
import { ExerciseType } from '../enums/exercise-type.enum';
import { UserExerciseStats } from './user-exercise-stats.entity';

@Entity('exercises')
@Unique(['name'])
@Index(['name'])
@Index(['equipment_type'])
@Index(['primary_muscle'])
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column()
  @ApiProperty()
  name: string;

  @Column({ type: 'enum', enum: EquipmentType, nullable: false })
  @ApiProperty({ enum: EquipmentType })
  equipment_type: EquipmentType;

  @Column({ type: 'enum', enum: DetailedMuscleGroup, nullable: false })
  @ApiProperty({ enum: DetailedMuscleGroup })
  primary_muscle: DetailedMuscleGroup;

  @Column({
    type: 'enum',
    enum: DetailedMuscleGroup,
    array: true,
    nullable: true,
  })
  @ApiProperty({ enum: DetailedMuscleGroup, isArray: true, required: false })
  secondary_muscles?: DetailedMuscleGroup[];

  @Column({ type: 'enum', enum: ExerciseType, nullable: false })
  @ApiProperty({ enum: ExerciseType })
  exercise_type: ExerciseType;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ required: false })
  image_url?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty()
  createdAt: Date;

  @OneToMany(() => UserExerciseStats, (stats) => stats.exercise)
  userStats: UserExerciseStats[];
}
