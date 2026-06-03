import { User } from 'src/users/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ReportReason } from '../enums/report-reason.enum';
import { PostComment } from './comment.entity';

@Entity('comment_reports')
@Unique(['reporter', 'comment'])
export class CommentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  reporter: User;

  @ManyToOne(() => PostComment, (comment) => comment.reports, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  comment: PostComment;

  @Column({ type: 'enum', enum: ReportReason, default: ReportReason.OTHER })
  reason: ReportReason;

  @CreateDateColumn()
  createdAt: Date;
}
