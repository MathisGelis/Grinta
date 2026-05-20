import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/users.entity';

@Entity('connections')
@Unique(['follower', 'following'])
export class Connection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  follower: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  following: User;

  @CreateDateColumn()
  createdAt: Date;
}
