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
 * A password reset link sent by email. Only the SHA-256 of the token is
 * stored: reading the table does not give working links. A token works once
 * and for one hour; asking for a new link drops the previous ones.
 */
@Entity('password_reset_tokens')
@Index('IDX_password_reset_tokens_user', ['user'])
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_password_reset_tokens',
  })
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_password_reset_tokens_user' })
  user: User;

  /** Hex SHA-256 of the token in the link. */
  @Index('UQ_password_reset_tokens_hash', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
