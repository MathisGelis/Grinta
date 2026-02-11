import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/users.entity';
import { Exercise } from '../../exercise/entities/exercise.entity';

export type SetPair = { reps: number; weight: number };

@Entity('planned_workouts')
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

  @OneToMany(() => PlannedWorkoutExercise, (pwe) => pwe.workout, { cascade: true })
  @ApiProperty({ type: () => [PlannedWorkoutExercise] })
  exercises: PlannedWorkoutExercise[];

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;
}

@Entity('planned_workout_exercises')
export class PlannedWorkoutExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlannedWorkout, (workout) => workout.exercises, { onDelete: 'CASCADE' })
  workout: PlannedWorkout;

  @ManyToOne(() => Exercise, { eager: true })
  exercise: Exercise;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ type: 'array', description: 'Array of sets { reps, weight }', required: false, example: [{ reps: 10, weight: 50 }] })
  sets?: SetPair[];

  @Column({ type: 'int', nullable: true })
  plannedRestSeconds?: number;
}
