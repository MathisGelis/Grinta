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

export enum IdentityProvider {
  APPLE = 'apple',
  GOOGLE = 'google',
}

/**
 * An Apple or Google account linked to a Grinta account. `subject` is the
 * provider's stable user id (the `sub` claim): the email can change or be
 * hidden behind an Apple relay, the subject does not.
 */
@Entity('user_identities')
@Index('UQ_user_identities_provider_subject', ['provider', 'subject'], {
  unique: true,
})
@Index('IDX_user_identities_user', ['user'])
export class UserIdentity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_user_identities',
  })
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ foreignKeyConstraintName: 'FK_user_identities_user' })
  user: User;

  @Column({ type: 'varchar', length: 16 })
  provider: IdentityProvider;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @CreateDateColumn()
  createdAt: Date;
}
