import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/users.entity';
import { WorkoutPlannedExercise } from './workout-planned-exercise.entity';

@Entity('workouts_planned')
@Index(['user'])
export class WorkoutPlanned {
	@PrimaryGeneratedColumn('uuid')
	@ApiProperty()
	id: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	user: User;

	@Column()
	@ApiProperty()
	title: string;

	@Column({ type: 'text', nullable: true })
	@ApiProperty({ required: false })
	description?: string;

	@OneToMany(
		() => WorkoutPlannedExercise,
		(exercise) => exercise.workout,
		{ cascade: true },
	)
	exercises: WorkoutPlannedExercise[];

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;
}
