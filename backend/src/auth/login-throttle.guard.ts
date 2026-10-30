import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectThrottlerStorage, ThrottlerStorage } from '@nestjs/throttler';
import { createHash } from 'crypto';
import type { Request, Response } from 'express';
import { TooManyRequestsException } from '../common/throttling/too-many-requests.exception';
import { LOGIN_IP_THROTTLE, LOGIN_THROTTLE } from './auth.constants';

/**
 * Login attempts, counted twice in the throttler's storage:
 * - per account and address: a wrong password typed again and again locks
 *   that account from that address only, not the other people behind the
 *   same NAT (a gym, a campus, a mobile carrier);
 * - per address, with a higher limit: one machine cannot try password after
 *   password across many accounts.
 * Every attempt counts, successful or not. The identifier is hashed in the
 * keys, so no email address sits in the storage.
 */
@Injectable()
export class LoginThrottleGuard implements CanActivate {
  constructor(
    @InjectThrottlerStorage() private readonly storage: ThrottlerStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const body = req.body as { identifier?: unknown } | undefined;
    const identifier =
      typeof body?.identifier === 'string'
        ? body.identifier.trim().toLowerCase()
        : '';
    const ip = req.ip ?? 'unknown';
    const account = createHash('sha256').update(identifier).digest('hex');
    const records = await Promise.all([
      this.hit(`login:account:${ip}:${account}`, LOGIN_THROTTLE),
      this.hit(`login:ip:${ip}`, LOGIN_IP_THROTTLE),
    ]);
    const wait = Math.max(
      0,
      ...records.filter((r) => r.isBlocked).map((r) => r.timeToBlockExpire),
    );

    if (!wait) return true;
    http.getResponse<Response>().header('Retry-After', String(wait));
    throw new TooManyRequestsException(
      'TOO_MANY_LOGIN_ATTEMPTS',
      `Trop de tentatives de connexion. Réessayez dans ${Math.ceil(wait / 60)} min.`,
      wait,
    );
  }

  private hit(key: string, rule: { limit: number; ttl: number }) {
    return this.storage.increment(key, rule.ttl, rule.limit, rule.ttl, 'login');
  }
}
