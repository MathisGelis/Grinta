import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createPost,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

describe('Pagination caps and light endpoints (e2e)', () => {
  let app: NestExpressApplication;
  let owner: TestUser;
  const auth = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    owner = await createUser(app, 'pagin');
  });

  afterAll(() => app.close());

  it('caps posts/mine at 100 and ignores absurd limits', async () => {
    const res = await http(app)
      .get('/posts/mine?limit=100000')
      .set(auth(owner))
      .set('X-Forwarded-For', '10.8.0.1')
      .expect(200);

    expect(res.body.length).toBeLessThanOrEqual(100);
  });

  it('pages followers with limit and offset, capped at 100', async () => {
    const followers: TestUser[] = [];

    for (let i = 0; i < 3; i++) {
      const f = await createUser(app, 'fol');

      await http(app)
        .post(`/connections/${owner.id}/follow`)
        .set(auth(f))
        .set('X-Forwarded-For', `10.8.1.${i}`)
        .expect(201);
      followers.push(f);
    }
    const all = await http(app)
      .get(`/connections/${owner.id}/followers?limit=5000`)
      .set(auth(owner))
      .set('X-Forwarded-For', '10.8.0.2')
      .expect(200);
    const page = await http(app)
      .get(`/connections/${owner.id}/followers?limit=2&offset=2`)
      .set(auth(owner))
      .set('X-Forwarded-For', '10.8.0.3')
      .expect(200);

    expect(all.body).toHaveLength(3);
    expect(page.body).toHaveLength(1);
    expect(page.body[0].id).toBe(all.body[2].id);
  });

  it('lists the ids of my published workouts', async () => {
    const postId = await createPost(
      app,
      owner,
      await exerciseId(app, 'Bench Press (Barbell)'),
    );
    const res = await http(app)
      .get('/posts/mine/ids')
      .set(auth(owner))
      .set('X-Forwarded-For', '10.8.0.4')
      .expect(200);

    expect(res.body[0]).toEqual({
      postId: expect.any(String) as string,
      workoutId: expect.any(String) as string,
    });
    expect(res.body.map((r: { postId: string }) => r.postId)).toContain(postId);
  });

  it('serves the catalogue with an ETag and answers 304 when unchanged', async () => {
    const first = await http(app)
      .get('/exercises')
      .set(auth(owner))
      .set('X-Forwarded-For', '10.8.0.5')
      .expect(200);
    const etag = first.headers.etag;

    expect(etag).toBeTruthy();
    await http(app)
      .get('/exercises')
      .set(auth(owner))
      .set('X-Forwarded-For', '10.8.0.6')
      .set('If-None-Match', etag)
      .expect(304);
  });
});
