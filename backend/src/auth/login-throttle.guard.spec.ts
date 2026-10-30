import { ExecutionContext } from '@nestjs/common';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { TooManyRequestsException } from '../common/throttling/too-many-requests.exception';
import { LOGIN_IP_THROTTLE, LOGIN_THROTTLE } from './auth.constants';
import { LoginThrottleGuard } from './login-throttle.guard';

describe('LoginThrottleGuard', () => {
  let storage: ThrottlerStorageService;
  let guard: LoginThrottleGuard;
  let headers: Record<string, string>;

  beforeEach(() => {
    storage = new ThrottlerStorageService();
    guard = new LoginThrottleGuard(storage);
    headers = {};
  });

  afterEach(() => storage.onApplicationShutdown());

  const attempt = (identifier: string, ip: string) =>
    guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => ({ ip, body: { identifier } }),
        getResponse: () => ({
          header: (name: string, value: string) => (headers[name] = value),
        }),
      }),
    } as unknown as ExecutionContext);

  it('blocks an account from one address after 5 attempts', async () => {
    for (let i = 0; i < LOGIN_THROTTLE.limit; i++)
      await expect(attempt('paul@example.com', '1.1.1.1')).resolves.toBe(true);

    const blocked = attempt('Paul@Example.com ', '1.1.1.1');

    await expect(blocked).rejects.toBeInstanceOf(TooManyRequestsException);
    const error = await blocked.catch((e: TooManyRequestsException) => e);
    const body = (error as TooManyRequestsException).getResponse() as {
      code: string;
      retryAfterSeconds: number;
    };

    expect(body.code).toBe('TOO_MANY_LOGIN_ATTEMPTS');
    expect(body.retryAfterSeconds).toBeGreaterThan(0);
    expect(Number(headers['Retry-After'])).toBe(body.retryAfterSeconds);
  });

  it('leaves the other accounts behind the same address alone', async () => {
    for (let i = 0; i <= LOGIN_THROTTLE.limit; i++)
      await attempt('paul@example.com', '1.1.1.1').catch(() => undefined);

    await expect(attempt('julie@example.com', '1.1.1.1')).resolves.toBe(true);
    await expect(attempt('paul@example.com', '2.2.2.2')).resolves.toBe(true);
  });

  it('stops one address trying many accounts', async () => {
    for (let i = 0; i < LOGIN_IP_THROTTLE.limit; i++)
      await expect(attempt(`user${i}@example.com`, '3.3.3.3')).resolves.toBe(
        true,
      );

    await expect(attempt('new@example.com', '3.3.3.3')).rejects.toBeInstanceOf(
      TooManyRequestsException,
    );
    await expect(attempt('new@example.com', '4.4.4.4')).resolves.toBe(true);
  });
});
