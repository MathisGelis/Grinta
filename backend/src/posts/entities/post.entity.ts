import { User } from 'src/users/entities/users.entity';
import { CompletedWorkout } from 'src/workouts/entities/completed-workout.entity';
import {
  Column,
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

  /**
   * Likes and visible comments, kept up to date by PostsService in the same
   * transaction as the like or comment, so the feeds read a column instead of
   * counting rows for every post. The top feed of the month used to count the
   * likes of every post of the month on each call.
   */
  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
