import { RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { sign } from 'jsonwebtoken';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { createE2eApp, createUser, http } from './e2e-utils';

// The only routes reachable without a token. A new public route has to be
// added here on purpose; a route that loses its guard fails the test.
const PUBLIC_ROUTES = [
  'GET /',
  'GET /exercises',
  'GET /exercises/:id',
  'GET /health',
  'POST /auth/forgot-password',
  'POST /auth/login',
  'POST /auth/reset-password',
  'POST /users/register',
];

interface Route {
  method: string;
  path: string;
  protected: boolean;
}

function discoverRoutes(app: NestExpressApplication): Route[] {
  const reflector = app.get(Reflector);
  const scanner = app.get(MetadataScanner);
  const routes: Route[] = [];

  for (const wrapper of app.get(DiscoveryService).getControllers()) {
    const controller = wrapper.metatype as object;
    const prototype = Object.getPrototypeOf(wrapper.instance) as Record<
      string,
      object
    >;
    const base = reflector.get<string>(PATH_METADATA, controller) ?? '';
    const classGuards =
      reflector.get<unknown[]>(GUARDS_METADATA, controller) ?? [];

    for (const name of scanner.getAllMethodNames(prototype)) {
      const handler = prototype[name];
      const path = reflector.get<string | undefined>(PATH_METADATA, handler);

      if (path === undefined) continue;
      const guards = [
        ...classGuards,
        ...(reflector.get<unknown[]>(GUARDS_METADATA, handler) ?? []),
      ];

      routes.push({
        method:
          RequestMethod[reflector.get<RequestMethod>(METHOD_METADATA, handler)],
        path: `/${[base, path]
          .filter(
            (p): p is string => typeof p === 'string' && p !== '' && p !== '/',
          )
          .join('/')}`,
        protected: guards.includes(JwtAuthGuard),
      });
    }
  }
  return routes;
}

describe('Every protected route refuses a bad token (e2e)', () => {
  let app: NestExpressApplication;
  let routes: Route[];
  let badTokens: Record<string, string | undefined>;
  let validToken: string;

  beforeAll(async () => {
    app = await createE2eApp(undefined, [DiscoveryModule]);
    routes = discoverRoutes(app);

    const user = await createUser(app, 'guard');
    const gone = await createUser(app, 'gone');
    const payload = { sub: user.id, email: user.email };
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: object) =>
      Buffer.from(JSON.stringify(value)).toString('base64url');

    await app
      .get(DataSource)
      .query('DELETE FROM users WHERE id = $1', [gone.id]);
    validToken = user.token;
    badTokens = {
      missing: undefined,
      // Signed like a real token, with the API's secret, but expired.
      expired: sign(
        { ...payload, iat: now - 3600, exp: now - 60 },
        process.env.JWT_SECRET!,
        { algorithm: 'HS256' },
      ),
      'wrong signature': new JwtService({
        secret: 'another-secret-another-secret-another-secret',
      }).sign(payload),
      malformed: 'not.a.jwt',
      'alg none': `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ ...payload, iat: now, exp: now + 3600 })}.`,
      'deleted account': gone.token,
    };
  });

  afterAll(() => app.close());

  it('has exactly the expected public routes', () => {
    const publicRoutes = routes
      .filter((r) => !r.protected)
      .map((r) => `${r.method} ${r.path}`)
      .sort();

    expect(publicRoutes).toEqual(PUBLIC_ROUTES);
    expect(routes.filter((r) => r.protected).length).toBeGreaterThan(50);
  });

  it('answers 401 on every protected route, for every bad token', async () => {
    const id = '7f1c3a6e-2b4d-4c8e-9a0b-1d2e3f405162';
    const failures: string[] = [];
    let n = 0;

    for (const route of routes.filter((r) => r.protected))
      for (const [kind, token] of Object.entries(badTokens)) {
        // One address per request: the global rate limit must not answer
        // before the authentication does.
        const req = http(app)
          [route.method.toLowerCase() as 'get'](route.path.replace(/:\w+/g, id))
          .set('X-Forwarded-For', `30.0.${Math.floor(n / 250)}.${n++ % 250}`)
          .send({});
        const res = await (token ? req.auth(token, { type: 'bearer' }) : req);

        if (res.status !== 401)
          failures.push(
            `${route.method} ${route.path} [${kind}] -> ${res.status}`,
          );
      }
    expect(failures).toEqual([]);
  });

  it('still lets a valid token through', () =>
    http(app).get('/auth/me').auth(validToken, { type: 'bearer' }).expect(200));
});
