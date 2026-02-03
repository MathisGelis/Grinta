import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/users.entity';
import { WorkoutCompletedExercise } from './workout-completed-exercise.entity';

@Entity('workouts_completed')
@Index(['user'])
@Index(['user', 'completedAt'])
export class WorkoutCompleted {
	@PrimaryGeneratedColumn('uuid')
	@ApiProperty()
	id: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	user: User;

	@Column()
	@ApiProperty()
	title: string;

	@Column({ type: 'timestamp' })
	@ApiProperty()
	completedAt: Date;

	@Column({ type: 'int' })
	@ApiProperty({ description: 'Total duration in seconds' })
	total_duration_seconds: number;

	@Column({ type: 'text', nullable: true })
	@ApiProperty({ required: false })
	description?: string;

	@OneToMany(
		() => WorkoutCompletedExercise,
		(exercise) => exercise.workout,
		{ cascade: true },
	)
	exercises: WorkoutCompletedExercise[];
}
