import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { WorkoutCompletedExercise } from './workout-completed-exercise.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('workout_completed_sets')
@Index(['exercise'])
export class WorkoutCompletedSet {
	@PrimaryGeneratedColumn('uuid')
	@ApiProperty()
	id: string;

	@ManyToOne(() => WorkoutCompletedExercise, (exercise) => exercise.sets, {
		onDelete: 'CASCADE',
	})
	exercise: WorkoutCompletedExercise;

	@Column({ type: 'int' })
	@ApiProperty()
	reps: number;

	@Column({ type: 'float' })
	@ApiProperty()
	weight: number;

	@Column({ type: 'int', nullable: true })
	@ApiProperty({ required: false })
	rest_seconds?: number;
}
