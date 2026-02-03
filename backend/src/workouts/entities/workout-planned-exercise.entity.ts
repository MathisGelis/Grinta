import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { Exercise } from '../../exercise/entities/exercise.entity';
import { WorkoutPlanned } from './workout-planned.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('workout_planned_exercises')
@Index(['workout'])
export class WorkoutPlannedExercise {
	@PrimaryGeneratedColumn('uuid')
	@ApiProperty()
	id: string;

	@ManyToOne(() => WorkoutPlanned, (workout) => workout.exercises, {
		onDelete: 'CASCADE',
	})
	workout: WorkoutPlanned;

	@ManyToOne(() => Exercise)
	exercise: Exercise;

	@Column({ type: 'int', nullable: true })
	@ApiProperty({ required: false })
	rest_seconds?: number;

	@Column({ type: 'jsonb', nullable: true })
	@ApiProperty({
		example: [{ reps: 8, weight: 80 }],
		required: false,
	})
	planned_sets?: {
		reps?: number;
		weight?: number;
	}[];
}
