import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
  AfterLoad,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/users.entity';
import { Exercise } from '../../exercise/entities/exercise.entity';

export type SetPair = { reps: number; weight: number };

@Entity('planned_workouts')
@Index('IDX_planned_workouts_user_created', ['user', 'createdAt'])
export class PlannedWorkout {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @ApiProperty({ type: () => User })
  user: User;

  @Column()
  @ApiProperty()
  title: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ required: false })
  description?: string;

  /** Duration the user expects, in minutes (1 to 600), as they entered it. */
  @Column({ type: 'int', nullable: true })
  @ApiProperty({ required: false, nullable: true, minimum: 1, maximum: 600 })
  estimatedDurationMinutes?: number | null;

  @OneToMany(() => PlannedWorkoutExercise, (pwe) => pwe.workout, {
    cascade: true,
  })
  @ApiProperty({ type: () => [PlannedWorkoutExercise] })
  exercises: PlannedWorkoutExercise[];

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  /**
   * Rows come back from Postgres in no guaranteed order (a join or an update
   * can change it), so every load puts the exercises back in plan order,
   * whichever route or relation loaded them.
   */
  @AfterLoad()
  sortExercises() {
    this.exercises?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }
}

@Entity('planned_workout_exercises')
@Index('IDX_planned_workout_exercises_workout', ['workout'])
export class PlannedWorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlannedWorkout, (workout) => workout.exercises, {
    onDelete: 'CASCADE',
  })
  workout: PlannedWorkout;

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
  plannedRestSeconds?: number;

  /** Rank of the exercise in its workout, from 0. */
  @Column({ type: 'int', default: 0 })
  @ApiProperty({ example: 0, description: 'Rank in the workout, from 0' })
  position: number;
}
