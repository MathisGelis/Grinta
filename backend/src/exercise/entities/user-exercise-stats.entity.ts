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
import { SetPair } from '../../workouts/entities/completed-workout.entity';

/**
 * Per user and exercise summary of every completed workout. It is derived
 * data: ExerciseStatsService recomputes the affected rows from the workout
 * history whenever a completed workout is created, edited or deleted, so it
 * never drifts from the sessions it describes.
 */
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

  /** Heaviest weight lifted in a single set (kg). */
  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  PR?: number | null;

  /** Most reps done at the PR weight. */
  @Column({ type: 'int', nullable: true })
  pr_reps?: number | null;

  @Column({ type: 'float', nullable: true })
  best_estimated_1rm?: number | null;

  @Column({ type: 'float', nullable: true })
  best_session_volume?: number | null;

  /** Most reps in a single set without added weight. */
  @Column({ type: 'int', nullable: true })
  max_reps?: number | null;

  /** Top set of the most recent session (heaviest, then most reps). */
  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  last_reps?: number | null;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  last_weight?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  last_sets?: SetPair[] | null;

  @Column({ type: 'timestamp', nullable: true })
  last_performed_at?: Date | null;

  @Column({ type: 'int', default: 0 })
  total_sessions: number;

  @Column({ type: 'int', default: 0 })
  total_sets: number;

  @Column({ type: 'int', default: 0 })
  total_reps: number;

  @Column({ type: 'float', default: 0 })
  total_volume: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty()
  updatedAt: Date;
}
