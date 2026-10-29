import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/users.entity';
import { Group } from './group.entity';

/**
 * A post a member sent to the group, someone else's or their own. It shows
 * in the group feed only to the members allowed to see the post itself, and
 * goes away with the post. A post is shared once per group.
 */
@Entity('group_shares')
@Unique('UQ_group_shares_group_post', ['group', 'post'])
@Index('IDX_group_shares_post', ['post'])
export class GroupShare {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_group_shares',
  })
  id: string;

  @ManyToOne(() => Group, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_group_shares_group' })
  group: Group;

  @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_group_shares_post' })
  post: Post;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_group_shares_sharer' })
  sharer: User;

  @CreateDateColumn()
  createdAt: Date;
}
