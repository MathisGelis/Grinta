import { Global, Injectable, Module, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * SQL predicate true when the viewer may see the content of the user aliased
 * as `ownerAlias`: they are that user, the account is public, or the viewer
 * follows it (accepted follows only, a pending request is not in
 * `connections`). `viewer` is the placeholder of the viewer id in the query
 * (`$2`, `:viewerId`).
 *
 * The one rule for the content of an account. Reading a user's posts, stats
 * or follower lists, and sharing a workout, all go through it.
 */
export function visibleToViewerSql(ownerAlias: string, viewer: string): string {
  return `(
    ${ownerAlias}.id = ${viewer}
    OR ${ownerAlias}."isPublic" = true
    OR EXISTS (
      SELECT 1 FROM connections vc
      WHERE vc."followingId" = ${ownerAlias}.id
      AND vc."followerId" = ${viewer}
    )
  )`;
}

const NOT_FOUND_USER = 'Utilisateur introuvable';
const NOT_FOUND_COMPLETED = 'Completed workout not found';
const NOT_FOUND_PLANNED = 'Planned workout not found';

/**
 * Who may read what, answered with 404 and never 403 so that an id cannot be
 * probed: a private account looks the same as one that does not exist.
 *
 * - the lists and the stats of an account: `assertCanViewUserContent`;
 * - a completed workout: its owner, the people who follow them, and anyone
 *   for a public account but only once the workout is published (posted);
 * - a planned workout: its owner alone, plans are private drafts.
 */
@Injectable()
export class UserContentAccess {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Same rule as `visibleToViewerSql`, for one account. */
  async canViewUserContent(
    viewerId: string,
    ownerId: string,
  ): Promise<boolean> {
    const [row] = await this.dataSource.query<Array<{ visible: boolean }>>(
      `SELECT ${visibleToViewerSql('u', '$2')} AS visible
         FROM users u WHERE u.id = $1`,
      [ownerId, viewerId],
    );

    return row?.visible === true;
  }

  async assertCanViewUserContent(
    viewerId: string,
    ownerId: string,
    message = NOT_FOUND_USER,
  ): Promise<void> {
    if (!(await this.canViewUserContent(viewerId, ownerId)))
      throw new NotFoundException(message);
  }

  async assertCanViewCompletedWorkout(
    viewerId: string,
    workoutId: string,
  ): Promise<void> {
    const [row] = await this.dataSource.query<Array<{ allowed: boolean }>>(
      `SELECT (
          w."userId" = $2
          OR EXISTS (SELECT 1 FROM connections c
                      WHERE c."followingId" = w."userId" AND c."followerId" = $2)
          OR (u."isPublic" = true
              AND EXISTS (SELECT 1 FROM posts p WHERE p."workoutId" = w.id))
        ) AS allowed
         FROM completed_workouts w
         JOIN users u ON u.id = w."userId"
        WHERE w.id = $1`,
      [workoutId, viewerId],
    );

    if (!row?.allowed) throw new NotFoundException(NOT_FOUND_COMPLETED);
  }

  async assertCanViewPlannedWorkout(
    viewerId: string,
    workoutId: string,
  ): Promise<void> {
    const [row] = await this.dataSource.query<Array<{ allowed: boolean }>>(
      `SELECT "userId" = $2 AS allowed FROM planned_workouts WHERE id = $1`,
      [workoutId, viewerId],
    );

    if (!row?.allowed) throw new NotFoundException(NOT_FOUND_PLANNED);
  }
}

@Global()
@Module({
  providers: [UserContentAccess],
  exports: [UserContentAccess],
})
export class UserContentAccessModule {}
