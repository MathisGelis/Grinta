import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/users/entities/users.entity';
import { Post } from './post.entity';

/**
 * Someone the author trained with, tagged by an @handle in the title or the
 * description of the posted workout. `declined` is set when that person
 * removes themselves: the row stays for good, so that editing the text,
 * even removing and adding the @ again, never tags them back, and the post
 * no longer shows them.
 */
@Entity('post_partners')
@Unique(['post', 'user'])
@Index('IDX_post_partners_user', ['user'])
export class PostPartner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column({ default: false })
  declined: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
