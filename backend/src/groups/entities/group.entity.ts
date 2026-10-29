import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';

/** Longest group name, in characters. */
export const GROUP_NAME_MAX_LENGTH = 50;

/** Members of a group, the creator included. */
export const GROUP_MAX_MEMBERS = 20;

/**
 * A group of friends who follow each other's training: its members see the
 * workouts the others publish and the records those workouts set. Any member
 * can rename it and invite people; only its creator can delete it. It is
 * deleted with its creator's account.
 */
@Entity('groups')
@Index('IDX_groups_creator', ['creator'])
export class Group {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_groups' })
  id: string;

  @Column({ type: 'varchar', length: GROUP_NAME_MAX_LENGTH })
  name: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_groups_creator' })
  creator: User;

  @RelationId((group: Group) => group.creator)
  creatorId: string;

  @CreateDateColumn()
  createdAt: Date;
}
