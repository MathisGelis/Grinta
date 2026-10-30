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

describe('Comment length (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let postId: string;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'comment');
    postId = await createPost(
      app,
      user,
      await exerciseId(app, 'Squat (Barbell)'),
    );
  });

  afterAll(() => app.close());

  it('accepts 500 characters', () =>
    http(app)
      .post(`/posts/${postId}/comments`)
      .auth(user.token, { type: 'bearer' })
      .send({ content: 'a'.repeat(500) })
      .expect(201));

  it('refuses 501 with FIELD_TOO_LONG, when posting and when editing', async () => {
    const expected = {
      code: 'VALIDATION_ERROR',
      errors: [
        {
          field: 'content',
          code: 'FIELD_TOO_LONG',
          message: '« content » ne doit pas dépasser 500 caractères.',
        },
      ],
    };
    const created = await http(app)
      .post(`/posts/${postId}/comments`)
      .auth(user.token, { type: 'bearer' })
      .send({ content: 'a'.repeat(501) })
      .expect(400);

    expect(created.body).toMatchObject(expected);

    const comment = await http(app)
      .post(`/posts/${postId}/comments`)
      .auth(user.token, { type: 'bearer' })
      .send({ content: 'court' })
      .expect(201);
    const edited = await http(app)
      .patch(`/posts/comments/${(comment.body as { id: string }).id}`)
      .auth(user.token, { type: 'bearer' })
      .send({ content: 'b'.repeat(501) })
      .expect(400);

    expect(edited.body).toMatchObject(expected);
  });
});
