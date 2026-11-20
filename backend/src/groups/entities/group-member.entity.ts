import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Group } from './group.entity';

/**
 * A member of a group. The group only shows what members published after
 * `joinedAt`: joining does not open up an earlier history.
 */
@Entity('group_members')
@Unique('UQ_group_members_group_user', ['group', 'user'])
@Index('IDX_group_members_user', ['user'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_group_members',
  })
  id: string;

  @ManyToOne(() => Group, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_group_members_group' })
  group: Group;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_group_members_user' })
  user: User;

  @CreateDateColumn()
  joinedAt: Date;
}
