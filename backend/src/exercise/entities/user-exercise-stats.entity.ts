import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/users.entity';
import { Exercise } from './exercise.entity';

@Entity('user_exercise_stats')
@Unique(['user', 'exercise'])
export class UserExerciseStats {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty()
  user: User;

  @ManyToOne(() => Exercise, (exercise) => exercise.userStats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise_id' })
  @ApiProperty()
  exercise: Exercise;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  PR?: number;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  last_reps?: number;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  last_weight?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty()
  updatedAt: Date;
}
