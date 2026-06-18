import { ApiProperty } from '@nestjs/swagger';
import { PlannedWorkout } from 'src/workouts/entities/planned-workout.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Programme } from './programme.entity';

@Entity('programme_days')
@Index(['programme', 'dayNumber'], { unique: true })
export class ProgrammeDay {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @ManyToOne(() => Programme, (programme) => programme.days, {
    onDelete: 'CASCADE',
  })
  programme: Programme;

  @Column({ type: 'int' })
  @ApiProperty({
    example: 1,
    description: 'Position of this day in the programme (1, 2, 3, ...)',
  })
  dayNumber: number;

  @ManyToOne(() => PlannedWorkout, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  @ApiProperty({ required: false, nullable: true })
  workout?: PlannedWorkout | null; // null = rest day
}
