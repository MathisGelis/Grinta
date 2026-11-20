import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/users.entity';

/** How long the state of an account is trusted without asking the database. */
const CACHE_TTL_MS = 30_000;
const CACHE_MAX_ENTRIES = 10_000;

/**
 * True when a token issued at `issuedAt` (seconds, the JWT `iat`) still
 * stands after the last password change. A token of the very second of the
 * change stands: it is the one handed out with the new password.
 */
export function tokenStillValid(
  issuedAt: number | undefined,
  passwordChangedAt: Date | null,
): boolean {
  if (!passwordChangedAt) return true;
  if (issuedAt === undefined) return false;
  return issuedAt >= Math.floor(passwordChangedAt.getTime() / 1000);
}

/**
 * Tells JwtStrategy whether a token's account still exists and whether the
 * token predates the last password change. Cached a few seconds per user so
 * that a request does not cost a query each time; a change made by this
 * process drops the entry at once.
 */
@Injectable()
export class PasswordStateService {
  private readonly cache = new Map<
    string,
    { exists: boolean; changedAt: Date | null; fetchedAt: number }
  >();

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async isTokenCurrent(userId: string, issuedAt?: number): Promise<boolean> {
    const state = await this.stateOf(userId);

    return state.exists && tokenStillValid(issuedAt, state.changedAt);
  }

  forget(userId: string) {
    this.cache.delete(userId);
  }

  private async stateOf(userId: string) {
    const cached = this.cache.get(userId);

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;
    const user = await this.users.findOne({
      where: { id: userId },
      select: { id: true, passwordChangedAt: true },
    });
    const state = {
      exists: !!user,
      changedAt: user?.passwordChangedAt ?? null,
      fetchedAt: Date.now(),
    };

    if (this.cache.size >= CACHE_MAX_ENTRIES) this.cache.clear();
    this.cache.set(userId, state);
    return state;
  }
}
