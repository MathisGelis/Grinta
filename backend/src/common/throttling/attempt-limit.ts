import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectThrottlerStorage, ThrottlerStorage } from '@nestjs/throttler';
import { createHash } from 'crypto';
import type { Request, Response } from 'express';
import type { AuthUser } from '../../auth/auth-user.interface';
import {
  TooManyRequestsCode,
  TooManyRequestsException,
} from './too-many-requests.exception';

interface Rule {
  limit: number;
  /** Window, in milliseconds. */
  ttl: number;
}

export interface AttemptLimitOptions {
  /** Keeps the counters of each route apart. */
  scope: string;
  /**
   * What identifies the account: a field of the body (the login identifier,
   * an email) or the authenticated user.
   */
  account: { bodyField: string } | 'user';
  /** Attempts per account and client address. */
  perAccount: Rule;
  /** Attempts per client address, all accounts together. */
  perAddress: Rule;
  code: TooManyRequestsCode;
  /** French message, given the minutes to wait. */
  message: (minutes: number) => string;
}

const ATTEMPT_LIMIT = 'attemptLimit';

/**
 * Attempts on a sensitive route, counted twice in the throttler's storage:
 * - per account and address: someone retrying one account is stopped there,
 *   without locking the other people behind the same NAT (a gym, a campus,
 *   a mobile carrier);
 * - per address, higher: one machine cannot go through many accounts.
 * Every attempt counts, successful or not. The account is hashed in the
 * keys, so no email address sits in the storage. Over a limit: 429 with
 * Retry-After and { code, message, retryAfterSeconds }.
 */
export const AttemptLimit = (options: AttemptLimitOptions) =>
  applyDecorators(
    SetMetadata(ATTEMPT_LIMIT, options),
    UseGuards(AttemptLimitGuard),
  );

@Injectable()
export class AttemptLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectThrottlerStorage() private readonly storage: ThrottlerStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<AttemptLimitOptions | undefined>(
      ATTEMPT_LIMIT,
      context.getHandler(),
    );

    // Counting per user before the authentication guard ran would put
    // every caller in one bucket: let the authentication answer instead.
    if (!options || (options.account === 'user' && !this.userOf(context)))
      return true;
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: AuthUser }>();
    const ip = req.ip ?? 'unknown';
    const account = createHash('sha256')
      .update(accountOf(req, options.account))
      .digest('hex');
    const records = await Promise.all([
      this.hit(`${options.scope}:account:${ip}:${account}`, options.perAccount),
      this.hit(`${options.scope}:ip:${ip}`, options.perAddress),
    ]);
    const wait = Math.max(
      0,
      ...records.filter((r) => r.isBlocked).map((r) => r.timeToBlockExpire),
    );

    if (!wait) return true;
    http.getResponse<Response>().header('Retry-After', String(wait));
    throw new TooManyRequestsException(
      options.code,
      options.message(Math.ceil(wait / 60)),
      wait,
    );
  }

  private userOf(context: ExecutionContext) {
    return context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
  }

  private hit(key: string, rule: Rule) {
    return this.storage.increment(
      key,
      rule.ttl,
      rule.limit,
      rule.ttl,
      'attempts',
    );
  }
}

function accountOf(
  req: Request & { user?: AuthUser },
  account: AttemptLimitOptions['account'],
): string {
  if (account === 'user') return req.user?.id ?? '';
  const value = (req.body as Record<string, unknown> | undefined)?.[
    account.bodyField
  ];

  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
