import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationService } from '../moderation/moderation.service';
import { CommentReport } from './entities/comment-report.entity';
import { PostComment } from './entities/comment.entity';
import { PostLike } from './entities/like.entity';
import { Post } from './entities/post.entity';
import { ReportReason } from './enums/report-reason.enum';

const AUTO_HIDE_THRESHOLD = 5;

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(PostLike)
    private readonly likeRepository: Repository<PostLike>,

    @InjectRepository(PostComment)
    private readonly commentRepository: Repository<PostComment>,

    @InjectRepository(CommentReport)
    private readonly reportRepository: Repository<CommentReport>,

    private readonly moderation: ModerationService,
  ) {}

  async createPost(userId: string, workoutId: string) {
    const workout = await this.postRepository.manager.findOne(
      'CompletedWorkout',
      {
        where: { id: workoutId },
      },
    );

    if (!workout) throw new NotFoundException('Workout not found');
    const post = this.postRepository.create({
      user: { id: userId },
      workout: { id: workoutId },
    });
    return this.postRepository.save(post);
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.user.id !== userId) throw new ForbiddenException('Not allowed');
    await this.postRepository.delete(postId);
    return { message: 'Post deleted' };
  }

  async toggleLike(userId: string, postId: string) {
    const existing = await this.likeRepository.findOne({
      where: { user: { id: userId }, post: { id: postId } },
    });

    if (existing) {
      await this.likeRepository.delete(existing.id);

      return { liked: false };
    }
    await this.likeRepository.save({
      user: { id: userId },
      post: { id: postId },
    });
    return { liked: true };
  }

  async getLikesList(postId: string) {
    return this.likeRepository
      .createQueryBuilder('like')
      .innerJoin('like.user', 'user')
      .innerJoin('like.post', 'post')
      .where('post.id = :postId', { postId })
      .select([
        'user.id AS id',
        'user.displayName AS "displayName"',
        'user.uniqueName AS "uniqueName"',
        'like.createdAt AS "createdAt"',
      ])
      .orderBy('like.createdAt', 'DESC')
      .getRawMany();
  }

  async commentPost(userId: string, postId: string, content: string) {
    await this.assertCleanText(content);
    return this.commentRepository.save({
      user: { id: userId },
      post: { id: postId },
      content,
    });
  }

  async editComment(userId: string, commentId: string, content: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.user.id !== userId)
      throw new ForbiddenException('You can only edit your own comments');

    await this.assertCleanText(content);
    comment.content = content;
    return this.commentRepository.save(comment);
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'post', 'post.user'],
    });

    if (!comment) throw new NotFoundException('Comment not found');
    const isOwner = comment.user.id === userId;
    const isPostOwner = comment.post.user.id === userId;

    if (!isOwner && !isPostOwner) throw new ForbiddenException('Not allowed');
    await this.commentRepository.delete(commentId);
    return { message: 'Comment deleted' };
  }

  async getCommentsList(postId: string) {
    return this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin('comment.user', 'user')
      .innerJoin('comment.post', 'post')
      .where('post.id = :postId', { postId })
      .andWhere('comment.isHidden = false')
      .select([
        'comment.id AS id',
        'comment.content AS content',
        'comment.createdAt AS "createdAt"',
        'user.id AS "userId"',
        'user.displayName AS "displayName"',
      ])
      .orderBy('comment.createdAt', 'DESC')
      .getRawMany();
  }

  async reportComment(userId: string, commentId: string, reason: ReportReason) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.user.id === userId)
      throw new BadRequestException('You cannot report your own comment');
    const alreadyReported = await this.reportRepository.findOne({
      where: { reporter: { id: userId }, comment: { id: commentId } },
    });

    if (alreadyReported)
      throw new BadRequestException('You have already reported this comment');
    await this.reportRepository.save({
      reporter: { id: userId },
      comment: { id: commentId },
      reason,
    });
    await this.commentRepository.increment({ id: commentId }, 'reportCount', 1);

    const updated = await this.commentRepository.findOneBy({ id: commentId });
    let hidden = updated?.isHidden ?? false;

    if (updated && !hidden && updated.reportCount >= AUTO_HIDE_THRESHOLD) {
      await this.commentRepository.update(commentId, { isHidden: true });
      hidden = true;
    }
    return {
      message: 'Comment reported',
      reportCount: updated?.reportCount ?? 0,
      hidden,
    };
  }

  async getFollowingFeed(userId: string, limit = 20) {
    return this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.user', 'postUser')
      .innerJoin(
        'connections',
        'c',
        'c."followingId" = postUser.id AND c."followerId" = :userId',
        {
          userId,
        },
      )
      .select([
        'post.id AS id',
        'post.createdAt AS "createdAt"',
        'postUser.displayName AS "displayName"',
        `(SELECT COUNT(*) FROM post_likes l WHERE l."postId" = post.id) AS "likesCount"`,
        `(SELECT COUNT(*) FROM post_comments c WHERE c."postId" = post.id) AS "commentsCount"`,
        `EXISTS (
          SELECT 1 FROM post_likes ml
          WHERE ml."postId" = post.id
          AND ml."userId" = :userId
        ) AS "isLiked"`,
      ])
      .orderBy('post.createdAt', 'DESC')
      .limit(limit)
      .setParameter('userId', userId)
      .getRawMany();
  }

  async getTopPostsThisMonth(userId: string, limit = 20) {
    const startOfMonth = new Date();

    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.user', 'u')
      .where(
        `
          post."createdAt" >= :startOfMonth
          AND (
            u."isPublic" = true
            OR EXISTS (
              SELECT 1 FROM connections c
              WHERE c."followingId" = u."id"
              AND c."followerId" = :userId
            )
          )
        `,
        { startOfMonth, userId },
      )
      .select([
        'post.id AS id',
        'post."createdAt" AS "createdAt"',
        'u."displayName" AS "displayName"',
        `(SELECT COUNT(*) FROM post_likes l WHERE l."postId" = post.id) AS "likesCount"`,
        `(SELECT COUNT(*) FROM post_comments c WHERE c."postId" = post.id) AS "commentsCount"`,
        `(
          (SELECT COUNT(*) FROM post_likes l WHERE l."postId" = post.id)
          +
          (SELECT COUNT(*) FROM post_comments c WHERE c."postId" = post.id)
        ) AS score`,
        `EXISTS (
          SELECT 1 FROM post_likes ml
          WHERE ml."postId" = post.id
          AND ml."userId" = :userId
        ) AS "isLiked"`,
      ])
      .orderBy('score', 'DESC')
      .addOrderBy('post."createdAt"', 'DESC')
      .limit(limit)
      .setParameter('userId', userId)
      .getRawMany();
  }

  /** Reject text that fails moderation. Does not reveal the matched words. */
  private async assertCleanText(content: string) {
    const result = await this.moderation.check(content);
    if (!result.ok) {
      throw new BadRequestException(
        'Votre commentaire contient un langage non autorisé. Merci de le reformuler.',
      );
    }
  }
}
