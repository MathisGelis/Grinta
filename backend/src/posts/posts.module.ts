import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModerationModule } from '../moderation/moderation.module';
import { PostPartner } from './entities/post-partner.entity';
import { PostPartnersService } from './post-partners.service';
import { CommentReport } from './entities/comment-report.entity';
import { PostComment } from './entities/comment.entity';
import { PostLike } from './entities/like.entity';
import { Post } from './entities/post.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostLike,
      PostComment,
      CommentReport,
      PostPartner,
    ]),
    ModerationModule,
  ],
  providers: [PostsService, PostPartnersService],
  controllers: [PostsController],
  exports: [PostsService, PostPartnersService],
})
export class PostsModule {}
