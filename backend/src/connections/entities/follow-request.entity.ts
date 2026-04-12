import { User } from 'src/users/entities/users.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('follow_requests')
@Unique(['follower', 'following'])
export class FollowRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  follower: User;

  @ManyToOne(() => User, { nullable: false })
  following: User;

  @CreateDateColumn()
  createdAt: Date;
}
