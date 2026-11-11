import { NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { createE2eApp, createUser, http, TestUser } from './e2e-utils';

interface GroupDetail {
  id: string;
  members: Array<{ id: string }>;
  invitations: Array<{ invitee: { id: string }; invitedById: string }>;
}

describe('Create a group with a list of people (e2e)', () => {
  let app: NestExpressApplication;
  let creator: TestUser;
  let friends: TestUser[];
  let fan: TestUser;

  beforeAll(async () => {
    app = await createE2eApp();
    [creator, fan, ...friends] = await Promise.all(
      ['grpcreator', 'grpfan', 'grpfriend', 'grpfriend', 'grpfriend'].map(
        (prefix) => createUser(app, prefix),
      ),
    );
    const db = app.get(DataSource);
    const follow = (a: TestUser, b: TestUser) =>
      db.query(
        'INSERT INTO connections ("followerId", "followingId") VALUES ($1, $2)',
        [a.id, b.id],
      );

    for (const friend of friends) {
      await follow(creator, friend);
      await follow(friend, creator);
    }
    // Follows the creator, but is not followed back.
    await follow(fan, creator);
  });

  afterAll(() => app.close());

  const create = (body: object) =>
    http(app)
      .post('/groups')
      .auth(creator.token, { type: 'bearer' })
      .send(body);
  const groupCount = async () =>
    (
      await app
        .get(DataSource)
        .query<
          Array<{ n: number }>
        >('SELECT COUNT(*)::int AS n FROM groups WHERE "creatorId" = $1', [creator.id])
    )[0].n;

  it('invites everyone on the list as the group is created', async () => {
    const res = await create({
      name: 'Team du mardi',
      userIds: [...friends.map((f) => f.id), creator.id],
    }).expect(201);
    const group = res.body as GroupDetail;

    expect(group.members.map((m) => m.id)).toEqual([creator.id]);
    expect(group.invitations.map((i) => i.invitee.id).sort()).toEqual(
      friends.map((f) => f.id).sort(),
    );

    // Each friend sees the invitation and can join.
    const invitations = (
      await http(app)
        .get('/groups/invitations')
        .auth(friends[0].token, { type: 'bearer' })
        .expect(200)
    ).body as Array<{ id: string; group: { id: string } }>;
    const invitation = invitations.find((i) => i.group.id === group.id)!;

    await http(app)
      .post(`/groups/invitations/${invitation.id}/accept`)
      .auth(friends[0].token, { type: 'bearer' })
      .expect(201);
  });

  it('still creates a group without a list', async () => {
    const res = await create({ name: 'Solo' }).expect(201);

    expect((res.body as GroupDetail).invitations).toEqual([]);
  });

  it('creates nothing when someone on the list cannot be invited', async () => {
    const before = await groupCount();
    const notMutual = await create({
      name: 'Raté',
      userIds: [friends[1].id, fan.id],
    }).expect(403);

    expect(notMutual.body).toMatchObject({
      code: 'GROUP_USERS_NOT_MUTUAL',
      userIds: [fan.id],
    });
    const unknown = '7f1c3a6e-2b4d-4c8e-9a0b-1d2e3f405162';
    const missing = await create({
      name: 'Raté',
      userIds: [friends[1].id, unknown],
    }).expect(404);

    expect(missing.body).toMatchObject({
      code: 'GROUP_USERS_NOT_FOUND',
      userIds: [unknown],
    });
    expect(await groupCount()).toBe(before);
  });

  it('validates the list', async () => {
    await create({ name: 'X', userIds: ['nope'] }).expect(400);
    await create({ name: 'X', userIds: [friends[0].id, friends[0].id] }).expect(
      400,
    );
    await create({
      name: 'X',
      userIds: Array.from(
        { length: 20 },
        (_, i) => `7f1c3a6e-2b4d-4c8e-9a0b-${String(i).padStart(12, '0')}`,
      ),
    }).expect(400);
  });
});
