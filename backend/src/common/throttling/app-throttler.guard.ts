import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { TooManyRequestsException } from './too-many-requests.exception';

/**
 * The global rate limit (per IP), with a 429 that says when to retry. The
 * throttler already sets the Retry-After header before throwing.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(
    _context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new TooManyRequestsException(
      'RATE_LIMITED',
      'Trop de requêtes. Réessayez dans un instant.',
      detail.timeToBlockExpire,
    );
  }
}
