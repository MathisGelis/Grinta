import { User } from 'src/users/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CommentReport } from './comment-report.entity';
import { Post } from './post.entity';

@Entity('post_comments')
export class PostComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => Post, (post) => post.comments, {
    onDelete: 'CASCADE',
  })
  post: Post;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: 0 })
  reportCount: number;

  @Column({ default: false })
  isHidden: boolean;

  @OneToMany(() => CommentReport, (report) => report.comment)
  reports: CommentReport[];

  @CreateDateColumn()
  createdAt: Date;
}
