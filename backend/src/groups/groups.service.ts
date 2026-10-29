import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BADGE_UNIT, BadgeType } from '../badges/enums/badge-type.enum';
import { GroupInvitation } from './entities/group-invitation.entity';
import { GroupMember } from './entities/group-member.entity';
import { Group, GROUP_MAX_MEMBERS } from './entities/group.entity';

const DEFAULT_ACTIVITY_LIMIT = 20;

// The public card of a user, as the other lists of the API show it.
const userCard = (alias: string) => `
  ${alias}.id AS "id",
  ${alias}."uniqueName" AS "uniqueName",
  ${alias}."displayName" AS "displayName",
  COALESCE(${alias}."avatarThumbnailUrl", ${alias}."avatarUrl") AS "avatarThumbnailUrl"`;

type UserCard = {
  id: string;
  uniqueName: string;
  displayName: string;
  avatarThumbnailUrl: string | null;
};

/**
 * Groups of friends. Members are people who follow each other: inviting
 * someone takes a mutual follow, and they join by accepting. Any member can
 * rename the group and invite; only the creator can delete it. When the
 * creator leaves, the longest-standing member becomes the creator, and the
 * last one to leave deletes the group. The group feed shows the workouts its
 * members published after joining, with the records those workouts set.
 */
@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  private get manager() {
    return this.groupRepository.manager;
  }

  create(userId: string, name: string) {
    return this.manager.transaction(async (manager) => {
      const group = await manager.save(
        manager.create(Group, { name, creator: { id: userId } }),
      );

      await manager.insert(GroupMember, {
        group: { id: group.id },
        user: { id: userId },
      });
      return this.detail(userId, group.id, manager);
    });
  }

  /** The user's groups, the last one joined first. */
  listMine(userId: string) {
    return this.manager.query<
      Array<{
        id: string;
        name: string;
        creatorId: string;
        memberCount: number;
        joinedAt: Date;
      }>
    >(
      `SELECT g.id, g.name, g."creatorId", g."createdAt", gm."joinedAt",
              (SELECT COUNT(*)::int FROM group_members x WHERE x."groupId" = g.id)
                AS "memberCount"
         FROM groups g
         JOIN group_members gm ON gm."groupId" = g.id AND gm."userId" = $1
        ORDER BY gm."joinedAt" DESC`,
      [userId],
    );
  }

  /** The group with its members and pending invitations. Members only. */
  async detail(userId: string, groupId: string, manager = this.manager) {
    await this.assertMember(manager, userId, groupId);
    const [[group], members, invitations] = await Promise.all([
      manager.query<
        Array<{ id: string; name: string; creatorId: string; createdAt: Date }>
      >(`SELECT id, name, "creatorId", "createdAt" FROM groups WHERE id = $1`, [
        groupId,
      ]),
      manager.query<Array<UserCard & { joinedAt: Date }>>(
        `SELECT ${userCard('u')}, gm."joinedAt"
           FROM group_members gm JOIN users u ON u.id = gm."userId"
          WHERE gm."groupId" = $1
          ORDER BY gm."joinedAt"`,
        [groupId],
      ),
      this.pendingInvitations(manager, groupId),
    ]);

    return { ...group, members, invitations };
  }

  async rename(userId: string, groupId: string, name: string) {
    await this.assertMember(this.manager, userId, groupId);
    await this.manager.query(`UPDATE groups SET name = $2 WHERE id = $1`, [
      groupId,
      name,
    ]);
    return this.detail(userId, groupId);
  }

  async remove(userId: string, groupId: string) {
    await this.assertMember(this.manager, userId, groupId);
    const [deleted] = await this.manager.query<unknown[][]>(
      `DELETE FROM groups WHERE id = $1 AND "creatorId" = $2 RETURNING id`,
      [groupId, userId],
    );

    if (!deleted.length)
      throw new ForbiddenException(
        'Seul le créateur du groupe peut le supprimer.',
      );
    return { deleted: true };
  }

  /**
   * Invites someone by username. Any member can, provided the two of them
   * follow each other. Pending invitations count towards the size limit, so
   * accepting never overfills the group. The group row is locked, so two
   * invitations sent at once cannot both take the last place.
   */
  invite(userId: string, groupId: string, uniqueName: string) {
    return this.manager.transaction(async (manager) => {
      await this.lockGroup(manager, groupId);
      await this.assertMember(manager, userId, groupId);
      const [invitee] = await manager.query<
        Array<{ id: string; following: boolean; followedBy: boolean }>
      >(
        `SELECT u.id,
                EXISTS (SELECT 1 FROM connections c
                         WHERE c."followerId" = $2 AND c."followingId" = u.id)
                  AS following,
                EXISTS (SELECT 1 FROM connections c
                         WHERE c."followerId" = u.id AND c."followingId" = $2)
                  AS "followedBy"
           FROM users u WHERE u."uniqueName" = $1`,
        [uniqueName, userId],
      );

      if (!invitee) throw new NotFoundException('Utilisateur introuvable.');
      if (invitee.id === userId)
        throw new BadRequestException('Vous êtes déjà dans ce groupe.');
      if (!invitee.following || !invitee.followedBy)
        throw new ForbiddenException(
          'Vous devez vous suivre mutuellement pour inviter cette personne.',
        );
      const [{ members, pending, alreadyMember, alreadyInvited }] =
        await manager.query<
          Array<{
            members: number;
            pending: number;
            alreadyMember: boolean;
            alreadyInvited: boolean;
          }>
        >(
          `SELECT
             (SELECT COUNT(*)::int FROM group_members WHERE "groupId" = $1) AS members,
             (SELECT COUNT(*)::int FROM group_invitations WHERE "groupId" = $1) AS pending,
             EXISTS (SELECT 1 FROM group_members
                      WHERE "groupId" = $1 AND "userId" = $2) AS "alreadyMember",
             EXISTS (SELECT 1 FROM group_invitations
                      WHERE "groupId" = $1 AND "inviteeId" = $2) AS "alreadyInvited"`,
          [groupId, invitee.id],
        );

      if (alreadyMember)
        throw new ConflictException('Cette personne est déjà dans le groupe.');
      if (alreadyInvited)
        throw new ConflictException('Cette personne est déjà invitée.');
      if (members + pending >= GROUP_MAX_MEMBERS)
        throw new ConflictException(
          `Le groupe est complet : ${GROUP_MAX_MEMBERS} membres au plus, invitations en attente comprises.`,
        );
      await manager.insert(GroupInvitation, {
        group: { id: groupId },
        invitee: { id: invitee.id },
        inviter: { id: userId },
      });
      return this.pendingInvitations(manager, groupId);
    });
  }

  /** Invitations the user received and has not answered yet. */
  myInvitations(userId: string) {
    return this.manager.query(
      `SELECT i.id, i."createdAt",
              json_build_object(
                'id', g.id,
                'name', g.name,
                'memberCount',
                (SELECT COUNT(*)::int FROM group_members x WHERE x."groupId" = g.id)
              ) AS "group",
              json_build_object(
                'id', u.id,
                'uniqueName', u."uniqueName",
                'displayName', u."displayName",
                'avatarThumbnailUrl', COALESCE(u."avatarThumbnailUrl", u."avatarUrl")
              ) AS "invitedBy"
         FROM group_invitations i
         JOIN groups g ON g.id = i."groupId"
         JOIN users u ON u.id = i."inviterId"
        WHERE i."inviteeId" = $1
        ORDER BY i."createdAt" DESC`,
      [userId],
    );
  }

  accept(userId: string, invitationId: string) {
    return this.manager.transaction(async (manager) => {
      const [invitation] = await manager.query<Array<{ groupId: string }>>(
        `SELECT "groupId" FROM group_invitations
          WHERE id = $1 AND "inviteeId" = $2`,
        [invitationId, userId],
      );

      if (!invitation) throw new NotFoundException('Invitation not found');
      await this.lockGroup(manager, invitation.groupId);
      const [{ members }] = await manager.query<Array<{ members: number }>>(
        `SELECT COUNT(*)::int AS members FROM group_members WHERE "groupId" = $1`,
        [invitation.groupId],
      );

      if (members >= GROUP_MAX_MEMBERS)
        throw new ConflictException(
          `Le groupe est complet : ${GROUP_MAX_MEMBERS} membres au plus.`,
        );
      await manager.query(`DELETE FROM group_invitations WHERE id = $1`, [
        invitationId,
      ]);
      await manager
        .createQueryBuilder()
        .insert()
        .into(GroupMember)
        .values({ group: { id: invitation.groupId }, user: { id: userId } })
        .orIgnore()
        .execute();
      return this.detail(userId, invitation.groupId, manager);
    });
  }

  async decline(userId: string, invitationId: string) {
    const [deleted] = await this.manager.query<unknown[][]>(
      `DELETE FROM group_invitations
        WHERE id = $1 AND "inviteeId" = $2 RETURNING id`,
      [invitationId, userId],
    );

    if (!deleted.length) throw new NotFoundException('Invitation not found');
    return { declined: true };
  }

  /**
   * Leaves the group. A leaving creator hands the group over to the member
   * who joined first; the last member to leave deletes it.
   */
  leave(userId: string, groupId: string) {
    return this.manager.transaction(async (manager) => {
      await this.lockGroup(manager, groupId);
      await this.assertMember(manager, userId, groupId);
      await manager.query(
        `DELETE FROM group_members WHERE "groupId" = $1 AND "userId" = $2`,
        [groupId, userId],
      );
      const [group] = await manager.query<Array<{ creatorId: string }>>(
        `SELECT "creatorId" FROM groups WHERE id = $1`,
        [groupId],
      );

      if (group.creatorId !== userId) return { left: true };
      const [successor] = await manager.query<Array<{ userId: string }>>(
        `SELECT "userId" FROM group_members WHERE "groupId" = $1
          ORDER BY "joinedAt", id LIMIT 1`,
        [groupId],
      );

      if (successor)
        await manager.query(
          `UPDATE groups SET "creatorId" = $2 WHERE id = $1`,
          [groupId, successor.userId],
        );
      else await manager.query(`DELETE FROM groups WHERE id = $1`, [groupId]);
      return { left: true };
    });
  }

  /**
   * The group feed: one event per workout a member published since joining,
   * most recent first, with the personal records it set. Pages go back in
   * time with `before`, the `at` of the last event received.
   */
  async activity(
    userId: string,
    groupId: string,
    query: { limit?: number; before?: Date },
  ) {
    await this.assertMember(this.manager, userId, groupId);
    const posts = await this.manager.query<
      Array<
        UserCard & {
          postId: string;
          at: Date;
          workoutId: string;
          workoutTitle: string;
        }
      >
    >(
      `SELECT p.id AS "postId", p."createdAt" AS at,
              w.id AS "workoutId", w.title AS "workoutTitle", ${userCard('u')}
         FROM group_members gm
         JOIN posts p ON p."userId" = gm."userId" AND p."createdAt" >= gm."joinedAt"
         JOIN completed_workouts w ON w.id = p."workoutId"
         JOIN users u ON u.id = gm."userId"
        WHERE gm."groupId" = $1
          AND ($2::timestamp IS NULL OR p."createdAt" < $2)
        ORDER BY p."createdAt" DESC, p.id
        LIMIT $3`,
      [groupId, query.before ?? null, query.limit ?? DEFAULT_ACTIVITY_LIMIT],
    );
    const records = posts.length
      ? await this.manager.query<
          Array<{
            workoutId: string;
            type: BadgeType;
            value: number;
            exerciseId: string;
            exerciseName: string;
          }>
        >(
          `SELECT b."workoutId", b.type, b.value,
                  e.id AS "exerciseId", e.name AS "exerciseName"
             FROM badges b JOIN exercises e ON e.id = b."exerciseId"
            WHERE b."workoutId" = ANY($1)
            ORDER BY e.name, b.type`,
          [posts.map((p) => p.workoutId)],
        )
      : [];

    return posts.map((p) => ({
      postId: p.postId,
      at: p.at,
      user: {
        id: p.id,
        uniqueName: p.uniqueName,
        displayName: p.displayName,
        avatarThumbnailUrl: p.avatarThumbnailUrl,
      },
      workout: { id: p.workoutId, title: p.workoutTitle },
      records: records
        .filter((r) => r.workoutId === p.workoutId)
        .map((r) => ({
          exercise: { id: r.exerciseId, name: r.exerciseName },
          type: r.type,
          value: r.value,
          unit: BADGE_UNIT[r.type],
        })),
    }));
  }

  // A group the user is not in reads as missing, whether it exists or not.
  private async assertMember(
    manager: EntityManager,
    userId: string,
    groupId: string,
  ) {
    const [member] = await manager.query<unknown[]>(
      `SELECT 1 FROM group_members WHERE "groupId" = $1 AND "userId" = $2`,
      [groupId, userId],
    );

    if (!member) throw new NotFoundException('Group not found');
  }

  private async lockGroup(manager: EntityManager, groupId: string) {
    const [group] = await manager.query<unknown[]>(
      `SELECT 1 FROM groups WHERE id = $1 FOR UPDATE`,
      [groupId],
    );

    if (!group) throw new NotFoundException('Group not found');
  }

  private pendingInvitations(manager: EntityManager, groupId: string) {
    return manager.query(
      `SELECT i.id, i."createdAt",
              json_build_object(
                'id', u.id,
                'uniqueName', u."uniqueName",
                'displayName', u."displayName",
                'avatarThumbnailUrl', COALESCE(u."avatarThumbnailUrl", u."avatarUrl")
              ) AS invitee,
              i."inviterId" AS "invitedById"
         FROM group_invitations i JOIN users u ON u.id = i."inviteeId"
        WHERE i."groupId" = $1
        ORDER BY i."createdAt"`,
      [groupId],
    );
  }
}
