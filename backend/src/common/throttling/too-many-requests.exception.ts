import { HttpException, HttpStatus } from '@nestjs/common';

export type TooManyRequestsCode = 'RATE_LIMITED' | 'TOO_MANY_LOGIN_ATTEMPTS';

/**
 * A 429 that says when to retry: the Retry-After header carries the same
 * number of seconds as `retryAfterSeconds`. Sent at the top level by
 * AllExceptionsFilter, like every error body that has a `code`.
 */
export class TooManyRequestsException extends HttpException {
  constructor(
    code: TooManyRequestsCode,
    message: string,
    retryAfterSeconds: number,
  ) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code,
        message,
        retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
