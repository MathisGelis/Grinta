import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Programme } from './programme.entity';
import { PlannedWorkout } from 'src/workouts/entities/planned-workout.entity';

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

@Entity('programme_days')
export class ProgrammeDay {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @ManyToOne(() => Programme, (programme) => programme.days, { onDelete: 'CASCADE' })
  programme: Programme;

  @Column({ type: 'enum', enum: WeekDay })
  @ApiProperty({ enum: WeekDay })
  weekday: WeekDay;

  @ManyToOne(() => PlannedWorkout, { nullable: true })
  @JoinColumn()
  @ApiProperty({ required: false })
  workout?: PlannedWorkout | null; // null = rest day
}
