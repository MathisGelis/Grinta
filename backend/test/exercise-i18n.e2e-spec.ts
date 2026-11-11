import { NestExpressApplication } from '@nestjs/platform-express';
import {
  createE2eApp,
  createUser,
  ensureCatalogue,
  exerciseId,
  http,
  TestUser,
} from './e2e-utils';

interface ListedExercise {
  id: string;
  name: string;
  englishName?: string;
}

describe('Exercise catalogue in the language of the app (e2e)', () => {
  let app: NestExpressApplication;
  let user: TestUser;
  let bench: string;

  beforeAll(async () => {
    app = await createE2eApp();
    await ensureCatalogue(app);
    user = await createUser(app, 'i18n');
    bench = await exerciseId(app, 'Bench Press (Barbell)');
  });

  afterAll(() => app.close());

  const list = (language?: string) => {
    const req = http(app).get('/exercises');

    return language ? req.set('Accept-Language', language) : req;
  };

  it('serves the list in the requested language, English otherwise', async () => {
    const fr = await list('fr-FR,fr;q=0.9,en;q=0.8').expect(200);
    const en = await list().expect(200);
    const frBench = (fr.body as ListedExercise[]).find((e) => e.id === bench)!;
    const enBench = (en.body as ListedExercise[]).find((e) => e.id === bench)!;

    expect(frBench).toMatchObject({
      name: 'Développé couché (barre)',
      englishName: 'Bench Press (Barbell)',
    });
    expect(enBench.name).toBe('Bench Press (Barbell)');
    expect(enBench).not.toHaveProperty('englishName');
    expect(fr.headers.vary).toMatch(/Accept-Language/i);
    expect(fr.headers.etag).not.toBe(en.headers.etag);

    const de = await list('de').expect(200);

    expect(
      (de.body as ListedExercise[]).find((e) => e.id === bench)!.name,
    ).toBe('Bankdrücken (Langhantel)');
    // An unsupported language falls back to English.
    const nl = await list('nl').expect(200);

    expect(
      (nl.body as ListedExercise[]).find((e) => e.id === bench)!.name,
    ).toBe('Bench Press (Barbell)');
  });

  it('translates the description and instructions in French', async () => {
    const fr = await http(app)
      .get(`/exercises/${bench}`)
      .set('Accept-Language', 'fr')
      .expect(200);
    const body = fr.body as { description: string; instructions: string[] };

    expect(body.description).toMatch(/pectoraux/);
    expect(body.instructions[0]).toMatch(/^Allongez-vous/);

    // No German details yet: the English text stays, with the German name.
    const de = await http(app)
      .get(`/exercises/${bench}`)
      .set('Accept-Language', 'de')
      .expect(200);

    expect(de.body).toMatchObject({ name: 'Bankdrücken (Langhantel)' });
    expect((de.body as { description: string }).description).toMatch(
      /horizontal press/,
    );
  });

  it('answers 304 to the ETag of the same language only', async () => {
    const fr = await list('fr').expect(200);

    await list('fr').set('If-None-Match', fr.headers.etag).expect(304);
    await list('es').set('If-None-Match', fr.headers.etag).expect(200);
  });

  it('translates exercises nested in other responses', async () => {
    const created = await http(app)
      .post('/workouts/planned')
      .auth(user.token, { type: 'bearer' })
      .set('Accept-Language', 'fr')
      .send({ title: 'Pecs', exercises: [{ exerciseId: bench }] })
      .expect(201);
    const id = (created.body as { id: string }).id;
    const detail = await http(app)
      .get(`/workouts/planned/${id}`)
      .auth(user.token, { type: 'bearer' })
      .set('Accept-Language', 'es')
      .expect(200);
    const workout = (
      detail.body as {
        workout: {
          title: string;
          exercises: Array<{ exercise: ListedExercise }>;
        };
      }
    ).workout;

    expect(workout.title).toBe('Pecs');
    expect(workout.exercises[0].exercise.name).toBe('Press de banca (barra)');

    const templates = await http(app)
      .get('/workouts/templates')
      .auth(user.token, { type: 'bearer' })
      .set('Accept-Language', 'fr')
      .expect(200);

    expect(JSON.stringify(templates.body)).toContain(
      'Développé couché (barre)',
    );
  });

  it('keeps private fields hidden when translating', async () => {
    const res = await http(app)
      .get(`/users/${user.id}`)
      .auth(user.token, { type: 'bearer' })
      .set('Accept-Language', 'fr')
      .expect(200);

    expect(res.body).not.toHaveProperty('password');
  });
});
