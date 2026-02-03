import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { WorkoutCompleted } from './workout-completed.entity';
import { Exercise } from '../../exercise/entities/exercise.entity';
import { WorkoutCompletedSet } from './workout-completed-set.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('workout_completed_exercises')
@Index(['workout'])
export class WorkoutCompletedExercise {
	@PrimaryGeneratedColumn('uuid')
	@ApiProperty()
	id: string;

	@ManyToOne(() => WorkoutCompleted, (workout) => workout.exercises, {
		onDelete: 'CASCADE',
	})
	workout: WorkoutCompleted;

	@ManyToOne(() => Exercise)
	exercise: Exercise;

	@OneToMany(() => WorkoutCompletedSet, (set) => set.exercise, {
		cascade: true,
	})
	sets: WorkoutCompletedSet[];
}
