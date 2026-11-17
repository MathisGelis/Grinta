import type { Request } from 'express';

/**
 * Shape of `req.user` as built by JwtStrategy.validate. The identifier lives
 * in `id`, never in `userId`: reading a missing key yields undefined, which
 * TypeORM silently drops from a where clause and widens the query to every row.
 */
export interface AuthUser {
  id: string;
  email: string;
}

export type AuthenticatedRequest = Request & { user: AuthUser };
