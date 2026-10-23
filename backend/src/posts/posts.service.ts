import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { clampLimit } from '../common/utils/limit';
import { ModerationService } from '../moderation/moderation.service';
import { CommentReport } from './entities/comment-report.entity';
import { PostComment } from './entities/comment.entity';
import { PostLike } from './entities/like.entity';
import { Post } from './entities/post.entity';
import { ReportReason } from './enums/report-reason.enum';
import { CompletedWorkout } from '../workouts/entities/completed-workout.entity';
import { partnersSql, PostPartnersService } from './post-partners.service';

const AUTO_HIDE_THRESHOLD = 5;

// Columns returned by the DELETE and UPDATE ... RETURNING on post_comments.
// Written as SQL: given as names, TypeORM keeps only entity properties and
// silently drops the "postId" foreign key.
type CommentRow = { isHidden: boolean; postId: string };

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

    private readonly partners: PostPartnersService,
  ) {}

  /**
   * Publishes a workout. The @handles of its title and description tag the
   * people the author trained with, returned under `partners`.
   */
  async createPost(userId: string, workoutId: string) {
    const workout = await this.postRepository.manager.findOne(
      CompletedWorkout,
      {
        where: { id: workoutId, user: { id: userId } },
      },
    );

    if (!workout) throw new NotFoundException('Workout not found');
    const alreadyPosted = await this.postRepository.exists({
      where: { workout: { id: workoutId } },
    });

    if (alreadyPosted)
      throw new BadRequestException('Ce workout est déjà publié.');
    return this.postRepository.manager.transaction(async (manager) => {
      const post = await manager.save(
        manager.create(Post, {
          user: { id: userId },
          workout: { id: workoutId },
        }),
      );

      await this.partners.sync(
        manager,
        post.id,
        userId,
        workout.title,
        workout.description,
      );
      const [{ partners }] = await manager.query<
        Array<{ partners: unknown[] }>
      >(`SELECT ${partnersSql('p')} AS partners FROM posts p WHERE p.id = $1`, [
        post.id,
      ]);

      return { ...post, partners };
    });
  }

  declinePartner(userId: string, postId: string) {
    return this.partners.decline(userId, postId);
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

  async getPostById(userId: string, postId: string) {
    const rows = await this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.user', 'u')
      .leftJoin('post.workout', 'w')
      .where('post.id = :postId', { postId })
      .andWhere(this.visibleToViewerSql('u'))
      .select([
        'post.id AS id',
        'post."createdAt" AS "createdAt"',
        'u.id AS "userId"',
        'u."displayName" AS "displayName"',
        'u."uniqueName" AS "uniqueName"',
        'COALESCE(u."avatarThumbnailUrl", u."avatarUrl") AS "avatarThumbnailUrl"',
        'w.id AS "workoutId"',
        'w.title AS "workoutTitle"',
        'w."photoUrl" AS "workoutPhotoUrl"',
        'w."photoThumbnailUrl" AS "workoutPhotoThumbnailUrl"',
        'w.description AS "workoutDescription"',
        'w."completionDate" AS "workoutCompletionDate"',
        'w."totalDurationSeconds" AS "workoutDurationSeconds"',
        'post."likesCount" AS "likesCount"',
        'post."commentsCount" AS "commentsCount"',
        `${partnersSql('post')} AS partners`,
        `EXISTS (
          SELECT 1 FROM post_likes ml
          WHERE ml."postId" = post.id AND ml."userId" = :userId
        ) AS "isLiked"`,
      ])
      .setParameter('userId', userId)
      .setParameter('viewerId', userId)
      .getRawOne();

    if (!rows) throw new NotFoundException('Post not found');
    return rows;
  }

  async getMyPosts(userId: string, limit?: number) {
    return this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.workout', 'w')
      .where('post."userId" = :userId', { userId })
      .select([
        'post.id AS id',
        'post."createdAt" AS "createdAt"',
        'w.id AS "workoutId"',
        'w.title AS "workoutTitle"',
        'w."photoUrl" AS "workoutPhotoUrl"',
        'w."photoThumbnailUrl" AS "workoutPhotoThumbnailUrl"',
        'w."completionDate" AS "workoutCompletionDate"',
        'post."likesCount" AS "likesCount"',
        'post."commentsCount" AS "commentsCount"',
        `${partnersSql('post')} AS partners`,
      ])
      .orderBy('post."createdAt"', 'DESC')
      .limit(clampLimit(limit))
      .getRawMany();
  }

  /**
   * The like and the post's counter change in one transaction, and the
   * counter moves only when a row was really inserted or deleted, so a double
   * tap or two concurrent requests cannot make it drift.
   */
  async toggleLike(userId: string, postId: string) {
    await this.assertPostVisible(userId, postId);
    return this.postRepository.manager.transaction(async (manager) => {
      const removed = await manager
        .createQueryBuilder()
        .delete()
        .from(PostLike)
        .where('"userId" = :userId AND "postId" = :postId', { userId, postId })
        .execute();

      if (removed.affected) {
        await this.bumpCounter(manager, postId, 'likesCount', -1);
        return { liked: false };
      }
      const inserted = await manager
        .createQueryBuilder()
        .insert()
        .into(PostLike)
        .values({ user: { id: userId }, post: { id: postId } })
        .orIgnore()
        .returning('id')
        .execute();

      if ((inserted.raw as unknown[]).length)
        await this.bumpCounter(manager, postId, 'likesCount', 1);
      return { liked: true };
    });
  }

  async getLikesList(viewerId: string, postId: string) {
    await this.assertPostVisible(viewerId, postId);
    return this.likeRepository
      .createQueryBuilder('like')
      .innerJoin('like.user', 'user')
      .innerJoin('like.post', 'post')
      .where('post.id = :postId', { postId })
      .select([
        'user.id AS id',
        'user.displayName AS "displayName"',
        'user.uniqueName AS "uniqueName"',
        'COALESCE(user.avatarThumbnailUrl, user.avatarUrl) AS "avatarThumbnailUrl"',
        'like.createdAt AS "createdAt"',
      ])
      .orderBy('like.createdAt', 'DESC')
      .getRawMany();
  }

  async commentPost(userId: string, postId: string, content: string) {
    await this.assertPostVisible(userId, postId);
    await this.assertCleanText(content);
    return this.postRepository.manager.transaction(async (manager) => {
      const comment = await manager.save(PostComment, {
        user: { id: userId },
        post: { id: postId },
        content,
      });

      await this.bumpCounter(manager, postId, 'commentsCount', 1);
      return comment;
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
    await this.postRepository.manager.transaction(async (manager) => {
      // A hidden comment was already taken off the counter when it was hidden.
      const deleted = await manager
        .createQueryBuilder()
        .delete()
        .from(PostComment)
        .where('id = :commentId', { commentId })
        .returning('"isHidden", "postId"')
        .execute();
      const row = (deleted.raw as CommentRow[])[0];

      if (row && !row.isHidden)
        await this.bumpCounter(manager, row.postId, 'commentsCount', -1);
    });
    return { message: 'Comment deleted' };
  }

  async getCommentsList(viewerId: string, postId: string) {
    await this.assertPostVisible(viewerId, postId);
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
        'COALESCE(user.avatarThumbnailUrl, user.avatarUrl) AS "avatarThumbnailUrl"',
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
      await this.hideComment(commentId);
      hidden = true;
    }
    return {
      message: 'Comment reported',
      reportCount: updated?.reportCount ?? 0,
      hidden,
    };
  }

  async getFollowingFeed(userId: string, limit?: number) {
    return this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.user', 'postUser')
      .leftJoin('post.workout', 'w')
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
        'COALESCE(postUser.avatarThumbnailUrl, postUser.avatarUrl) AS "avatarThumbnailUrl"',
        'w."photoThumbnailUrl" AS "workoutPhotoThumbnailUrl"',
        'post."likesCount" AS "likesCount"',
        'post."commentsCount" AS "commentsCount"',
        `${partnersSql('post')} AS partners`,
        `EXISTS (
          SELECT 1 FROM post_likes ml
          WHERE ml."postId" = post.id
          AND ml."userId" = :userId
        ) AS "isLiked"`,
      ])
      .orderBy('post.createdAt', 'DESC')
      .limit(clampLimit(limit))
      .setParameter('userId', userId)
      .getRawMany();
  }

  async getTopPostsThisMonth(userId: string, limit?: number) {
    const startOfMonth = new Date();

    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.user', 'u')
      .leftJoin('post.workout', 'w')
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
        'COALESCE(u."avatarThumbnailUrl", u."avatarUrl") AS "avatarThumbnailUrl"',
        'w."photoThumbnailUrl" AS "workoutPhotoThumbnailUrl"',
        'post."likesCount" AS "likesCount"',
        'post."commentsCount" AS "commentsCount"',
        `${partnersSql('post')} AS partners`,
        '(post."likesCount" + post."commentsCount") AS score',
        `EXISTS (
          SELECT 1 FROM post_likes ml
          WHERE ml."postId" = post.id
          AND ml."userId" = :userId
        ) AS "isLiked"`,
      ])
      .orderBy('score', 'DESC')
      .addOrderBy('post."createdAt"', 'DESC')
      .limit(clampLimit(limit))
      .setParameter('userId', userId)
      .getRawMany();
  }

  // Hides a visible comment and takes it off its post's counter; a comment
  // already hidden by a concurrent report is left as it is.
  private hideComment(commentId: string) {
    return this.postRepository.manager.transaction(async (manager) => {
      const hidden = await manager
        .createQueryBuilder()
        .update(PostComment)
        .set({ isHidden: true })
        .where('id = :commentId AND "isHidden" = false', { commentId })
        .returning('"postId"')
        .execute();
      const row = (hidden.raw as CommentRow[])[0];

      if (row) await this.bumpCounter(manager, row.postId, 'commentsCount', -1);
    });
  }

  // An explicit WHERE: increment() drops an undefined criterion and would
  // then update every post.
  private bumpCounter(
    manager: EntityManager,
    postId: string,
    counter: 'likesCount' | 'commentsCount',
    delta: 1 | -1,
  ) {
    return manager
      .createQueryBuilder()
      .update(Post)
      .set({ [counter]: () => `"${counter}" + ${delta}` })
      .where('id = :postId', { postId })
      .execute();
  }

  /**
   * SQL predicate true when the viewer may see the posts of the user aliased
   * as `authorAlias`: the viewer is the author, the author has a public
   * profile, or the viewer follows them. Expects a `:viewerId` parameter.
   */
  private visibleToViewerSql(authorAlias: string): string {
    return `(
      ${authorAlias}.id = :viewerId
      OR ${authorAlias}."isPublic" = true
      OR EXISTS (
        SELECT 1 FROM connections vc
        WHERE vc."followingId" = ${authorAlias}.id
        AND vc."followerId" = :viewerId
      )
    )`;
  }

  /**
   * Throws 404 when the post does not exist or its author's profile is private
   * and the viewer does not follow them. The same status is used for both
   * cases so a private post id cannot be probed.
   */
  private async assertPostVisible(viewerId: string, postId: string) {
    const visible = await this.postRepository
      .createQueryBuilder('post')
      .innerJoin('post.user', 'author')
      .where('post.id = :postId', { postId })
      .andWhere(this.visibleToViewerSql('author'))
      .setParameter('viewerId', viewerId)
      .getExists();

    if (!visible) throw new NotFoundException('Post not found');
  }

  private async assertCleanText(content: string) {
    const result = await this.moderation.check(content);
    if (!result.ok) {
      throw new BadRequestException(
        'Votre commentaire contient un langage non autorisé. Merci de le reformuler.',
      );
    }
  }
}
