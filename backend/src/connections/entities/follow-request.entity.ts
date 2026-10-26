import { User } from 'src/users/entities/users.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('follow_requests')
@Index('IDX_follow_requests_following', ['following'])
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
