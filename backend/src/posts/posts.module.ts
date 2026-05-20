import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/like.entity';
import { PostComment } from './entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike, PostComment])],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
