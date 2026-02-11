import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/users.entity';
import { Exercise } from '../../exercise/entities/exercise.entity';

export type SetPair = { reps: number; weight: number };

@Entity('completed_workouts')
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

  @OneToMany(() => CompletedWorkoutExercise, (cwe) => cwe.workout, { cascade: true })
  @ApiProperty({ type: () => [CompletedWorkoutExercise] })
  exercises: CompletedWorkoutExercise[];

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;
}

@Entity('completed_workout_exercises')
export class CompletedWorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CompletedWorkout, (workout) => workout.exercises, { onDelete: 'CASCADE' })
  workout: CompletedWorkout;

  @ManyToOne(() => Exercise, { eager: true })
  exercise: Exercise;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ type: 'array', description: 'Array of sets { reps, weight }', required: false, example: [{ reps: 10, weight: 50 }] })
  sets?: SetPair[];

  @Column({ type: 'int', nullable: true })
  timerSeconds?: number;
}
