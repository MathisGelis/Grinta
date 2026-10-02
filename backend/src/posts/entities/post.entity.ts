import { User } from 'src/users/entities/users.entity';
import { CompletedWorkout } from 'src/workouts/entities/completed-workout.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { PostComment } from './comment.entity';
import { PostLike } from './like.entity';

@Entity('posts')
@Index('IDX_posts_user_created', ['user', 'createdAt'])
@Index('IDX_posts_created', ['createdAt'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @OneToOne(() => CompletedWorkout, { eager: true })
  @JoinColumn()
  workout: CompletedWorkout;

  @OneToMany(() => PostLike, (like) => like.post, {
    cascade: true,
  })
  likes: PostLike[];

  @OneToMany(() => PostComment, (comment) => comment.post, {
    cascade: true,
  })
  comments: PostComment[];

  @CreateDateColumn()
  createdAt: Date;
}
