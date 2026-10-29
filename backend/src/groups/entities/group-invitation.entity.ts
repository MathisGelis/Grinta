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
 * A pending invitation to a group, removed once accepted or declined. A
 * person has at most one per group.
 */
@Entity('group_invitations')
@Unique('UQ_group_invitations_group_invitee', ['group', 'invitee'])
@Index('IDX_group_invitations_invitee', ['invitee'])
export class GroupInvitation {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_group_invitations',
  })
  id: string;

  @ManyToOne(() => Group, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_group_invitations_group' })
  group: Group;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_group_invitations_invitee' })
  invitee: User;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_group_invitations_inviter' })
  inviter: User;

  @CreateDateColumn()
  createdAt: Date;
}
