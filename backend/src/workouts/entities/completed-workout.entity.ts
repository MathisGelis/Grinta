import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/users.entity';
import { Exercise } from '../../exercise/entities/exercise.entity';

export type SetPair = { reps: number; weight: number };

@Entity('completed_workouts')
@Index('IDX_completed_workouts_user_date', ['user', 'completionDate'])
export class CompletedWorkout {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @ApiProperty({ type: () => User })
  user: User;

  @Column()
  @ApiProperty()
  title: string;

  @Column({ type: 'timestamp' })
  @ApiProperty()
  completionDate: Date;

  @Column({ type: 'int' })
  @ApiProperty({ description: 'Total duration in seconds' })
  totalDurationSeconds: number;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ required: false })
  description?: string;

  /** Set through PUT /workouts/completed/:id/photo only. */
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ type: String, required: false, nullable: true })
  photoUrl?: string | null;

  /** Smaller copy of the photo (600 px), for lists and feeds. */
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ type: String, required: false, nullable: true })
  photoThumbnailUrl?: string | null;

  @OneToMany(() => CompletedWorkoutExercise, (cwe) => cwe.workout, {
    cascade: true,
  })
  @ApiProperty({ type: () => [CompletedWorkoutExercise] })
  exercises: CompletedWorkoutExercise[];

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;
}

@Entity('completed_workout_exercises')
@Index('IDX_completed_workout_exercises_workout', ['workout'])
export class CompletedWorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CompletedWorkout, (workout) => workout.exercises, {
    onDelete: 'CASCADE',
  })
  workout: CompletedWorkout;

  @ManyToOne(() => Exercise, { eager: true })
  exercise: Exercise;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({
    type: 'array',
    description: 'Array of sets { reps, weight }',
    required: false,
    example: [{ reps: 10, weight: 50 }],
  })
  sets?: SetPair[];

  @Column({ type: 'int', nullable: true })
  timerSeconds?: number;
}
