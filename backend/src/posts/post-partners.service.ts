import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PostPartner } from './entities/post-partner.entity';
import { extractMentions, MAX_PARTNERS } from './utils/mentions';

/**
 * SQL expression listing the partners shown on the post aliased `postAlias`,
 * as a JSON array of { id, uniqueName, displayName, avatarThumbnailUrl },
 * oldest tag first then by username. One small indexed lookup per post.
 */
export function partnersSql(postAlias: string): string {
  return `COALESCE((
    SELECT json_agg(json_build_object(
             'id', pu.id,
             'uniqueName', pu."uniqueName",
             'displayName', pu."displayName",
             'avatarThumbnailUrl', COALESCE(pu."avatarThumbnailUrl", pu."avatarUrl")
           ) ORDER BY pp."createdAt", pu."uniqueName")
      FROM post_partners pp
      JOIN users pu ON pu.id = pp."userId"
     WHERE pp."postId" = ${postAlias}.id AND NOT pp.declined
  ), '[]'::json)`;
}

@Injectable()
export class PostPartnersService {
  constructor(
    @InjectRepository(PostPartner)
    private readonly partnerRepository: Repository<PostPartner>,
  ) {}

  /**
   * Makes the partners of a post match the @handles of its workout's title
   * and description: handles of existing users other than the author, at
   * most MAX_PARTNERS in order of appearance. Unknown handles stay plain
   * text. A refusal is kept even when the handle is removed, so taking the
   * @ out and putting it back does not tag that person again.
   */
  async sync(
    manager: EntityManager,
    postId: string,
    authorId: string,
    title: string | null | undefined,
    description: string | null | undefined,
  ): Promise<void> {
    const handles = extractMentions(title, description);
    const users: Array<{ id: string }> = handles.length
      ? await manager.query(
          `SELECT u.id
             FROM unnest($1::text[]) WITH ORDINALITY AS h(handle, position)
             JOIN users u ON u."uniqueName" = h.handle
            WHERE u.id <> $2
            ORDER BY h.position
            LIMIT $3`,
          [handles, authorId, MAX_PARTNERS],
        )
      : [];
    const ids = users.map((u) => u.id);

    await manager.query(
      `DELETE FROM post_partners
        WHERE "postId" = $1 AND NOT declined AND NOT ("userId" = ANY($2::uuid[]))`,
      [postId, ids],
    );
    if (ids.length)
      await manager.query(
        `INSERT INTO post_partners ("postId", "userId")
         SELECT $1, unnest($2::uuid[])
         ON CONFLICT ("postId", "userId") DO NOTHING`,
        [postId, ids],
      );
  }

  /** Re-syncs the post of a workout after its title or description changed. */
  async syncForWorkout(
    manager: EntityManager,
    workoutId: string,
    authorId: string,
    title: string | null | undefined,
    description: string | null | undefined,
  ): Promise<void> {
    const [post] = await manager.query<Array<{ id: string }>>(
      `SELECT id FROM posts WHERE "workoutId" = $1`,
      [workoutId],
    );

    if (post) await this.sync(manager, post.id, authorId, title, description);
  }

  /** Removes the caller from the partners of a post they were tagged in. */
  async decline(userId: string, postId: string): Promise<{ declined: true }> {
    const result = await this.partnerRepository
      .createQueryBuilder()
      .update(PostPartner)
      .set({ declined: true })
      .where('"postId" = :postId AND "userId" = :userId AND NOT declined', {
        postId,
        userId,
      })
      .execute();

    if (!result.affected)
      throw new NotFoundException("Vous n'êtes pas identifié sur ce post.");
    return { declined: true };
  }
}
