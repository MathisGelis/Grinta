import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Programme } from './programme.entity';

/**
 * The programme a user follows, one at a time: starting another one replaces
 * it. Its current day is counted in calendar days from `startedOn`, and it
 * starts over after its last day. Deleting the programme stops it.
 */
@Entity('active_programmes')
@Unique('UQ_active_programmes_user', ['user'])
@Index('IDX_active_programmes_programme', ['programme'])
export class ActiveProgramme {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_active_programmes',
  })
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_active_programmes_user' })
  user: User;

  @ManyToOne(() => Programme, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_active_programmes_programme' })
  programme: Programme;

  /** Day 1 of the programme, a calendar date (YYYY-MM-DD). */
  @Column({ type: 'date' })
  startedOn: string;

  @CreateDateColumn()
  createdAt: Date;
}
