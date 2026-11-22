import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';
import {
  CHANGE_PASSWORD_ATTEMPTS,
  LOGIN_ATTEMPTS,
  LOGIN_IP_THROTTLE,
  LOGIN_THROTTLE,
} from '../../auth/auth.constants';
import { AttemptLimitGuard, AttemptLimitOptions } from './attempt-limit';
import { TooManyRequestsException } from './too-many-requests.exception';

describe('AttemptLimitGuard', () => {
  let storage: ThrottlerStorageService;
  let headers: Record<string, string>;

  beforeEach(() => {
    storage = new ThrottlerStorageService();
    headers = {};
  });

  afterEach(() => storage.onApplicationShutdown());

  const attempt = (
    options: AttemptLimitOptions,
    req: { ip: string; body?: object; user?: { id: string } },
  ) =>
    new AttemptLimitGuard(
      { get: () => options } as unknown as Reflector,
      storage,
    ).canActivate({
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({
          header: (name: string, value: string) => (headers[name] = value),
        }),
      }),
    } as unknown as ExecutionContext);
  const login = (identifier: string, ip: string) =>
    attempt(LOGIN_ATTEMPTS, { ip, body: { identifier } });

  it('blocks an account from one address after 5 attempts', async () => {
    for (let i = 0; i < LOGIN_THROTTLE.limit; i++)
      await expect(login('paul@example.com', '1.1.1.1')).resolves.toBe(true);

    const error = await login('Paul@Example.com ', '1.1.1.1').catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(TooManyRequestsException);
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
      await login('paul@example.com', '1.1.1.1').catch(() => undefined);

    await expect(login('julie@example.com', '1.1.1.1')).resolves.toBe(true);
    await expect(login('paul@example.com', '2.2.2.2')).resolves.toBe(true);
  });

  it('stops one address trying many accounts', async () => {
    for (let i = 0; i < LOGIN_IP_THROTTLE.limit; i++)
      await expect(login(`user${i}@example.com`, '3.3.3.3')).resolves.toBe(
        true,
      );

    await expect(login('new@example.com', '3.3.3.3')).rejects.toBeInstanceOf(
      TooManyRequestsException,
    );
    await expect(login('new@example.com', '4.4.4.4')).resolves.toBe(true);
  });

  it('can count per authenticated user', async () => {
    const as = (id: string) =>
      attempt(CHANGE_PASSWORD_ATTEMPTS, { ip: '5.5.5.5', user: { id } });

    for (let i = 0; i < 5; i++) await expect(as('u1')).resolves.toBe(true);
    await expect(as('u1')).rejects.toBeInstanceOf(TooManyRequestsException);
    await expect(as('u2')).resolves.toBe(true);
  });
});
