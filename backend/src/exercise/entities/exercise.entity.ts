import { Entity, Column, PrimaryGeneratedColumn, Unique, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EquipmentType } from '../enums/equipment-type.enum';
import { DetailedMuscleGroup } from '../enums/detailed-muscle.enum';
import { ExerciseType } from '../enums/exercise-type.enum';
import { UserExerciseStats } from './user-exercise-stats.entity';

@Entity('exercises')
@Unique(['name'])
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column()
  @ApiProperty()
  name: string;

  @Column({ type: 'enum', enum: EquipmentType })
  @ApiProperty({ enum: EquipmentType })
  equipment_type: EquipmentType;

  @Column({ type: 'enum', enum: DetailedMuscleGroup })
  @ApiProperty({ enum: DetailedMuscleGroup })
  primary_muscle: DetailedMuscleGroup;

  @Column({
    type: 'enum',
    enum: DetailedMuscleGroup,
    array: true,
    nullable: true,
  })
  @ApiProperty({
    enum: DetailedMuscleGroup,
    isArray: true,
    required: false,
  })
  secondary_muscles?: DetailedMuscleGroup[];

  @Column({ type: 'enum', enum: ExerciseType })
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
