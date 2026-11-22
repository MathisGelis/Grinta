import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';

/**
 * A pending e-mail change: the link goes to the NEW address, and the account
 * keeps its current e-mail until the link is opened. Only the SHA-256 of the
 * token is stored. One pending change per account: asking again replaces it.
 */
@Entity('email_change_tokens')
@Index('IDX_email_change_tokens_user', ['user'])
export class EmailChangeToken {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_email_change_tokens',
  })
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_email_change_tokens_user' })
  user: User;

  @Column({ type: 'varchar', length: 254 })
  newEmail: string;

  /** Hex SHA-256 of the token in the link. */
  @Index('UQ_email_change_tokens_hash', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
