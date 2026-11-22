import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Exercise } from '../../exercise/entities/exercise.entity';
import { CompletedWorkout } from '../../workouts/entities/completed-workout.entity';
import { BadgeType } from '../enums/badge-type.enum';

/**
 * A personal record set by one completed workout on one exercise. It belongs
 * to the workout: editing the workout re-evaluates its badges and deleting it
 * deletes them (ON DELETE CASCADE), since the record no longer stands.
 */
@Entity('badges')
@Unique('UQ_badges_workout_exercise_type', ['workout', 'exercise', 'type'])
@Index('IDX_badges_user_achieved', ['user', 'achievedAt'])
@Index('IDX_badges_exercise', ['exercise'])
export class Badge {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_badges' })
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_badges_user' })
  user: User;

  @ManyToOne(() => Exercise, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_badges_exercise' })
  exercise: Exercise;

  @ManyToOne(() => CompletedWorkout, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_badges_workout' })
  workout: CompletedWorkout;

  @RelationId((badge: Badge) => badge.workout)
  workoutId: string;

  @Column({ type: 'enum', enum: BadgeType })
  type: BadgeType;

  /** The new record, in kg or reps depending on the type. */
  @Column({ type: 'float' })
  value: number;

  /** Best value of the other workouts at the time it was beaten. */
  @Column({ type: 'float' })
  previousValue: number;

  /** The set behind a per-set record, null for a whole-session record. */
  @Column({ type: 'float', nullable: true })
  weight: number | null;

  @Column({ type: 'int', nullable: true })
  reps: number | null;

  /** Completion date of the workout that set the record. */
  @Column({ type: 'timestamp' })
  achievedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
