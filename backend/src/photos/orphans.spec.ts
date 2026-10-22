import { findOrphans, ORPHAN_GRACE_MS } from './orphans';

describe('findOrphans', () => {
  const now = 10 * ORPHAN_GRACE_MS;
  const old = now - ORPHAN_GRACE_MS - 1;
  const key = (folder: string, n: number) =>
    `${folder}/0000000${n}-0000-4000-8000-000000000000.webp`;

  it('returns the old files no stored URL points to', () => {
    const files = [
      { key: key('avatars', 1), modifiedAt: old },
      { key: key('avatars', 2), modifiedAt: old },
      { key: key('workouts', 3), modifiedAt: old },
    ];

    expect(
      findOrphans(
        files,
        [`https://api.example.com/uploads/${key('avatars', 1)}`, null],
        now,
      ).map((f) => f.key),
    ).toEqual([key('avatars', 2), key('workouts', 3)]);
  });

  it('matches stored URLs whatever their prefix', () => {
    const files = [{ key: key('workouts', 1), modifiedAt: old }];

    expect(findOrphans(files, [`/uploads/${key('workouts', 1)}`], now)).toEqual(
      [],
    );
  });

  it('leaves recent files alone, their upload may still be in flight', () => {
    const files = [{ key: key('workouts', 1), modifiedAt: now - 1000 }];

    expect(findOrphans(files, [], now)).toEqual([]);
  });

  it('never returns a file the storage could not have written', () => {
    const files = [
      { key: 'avatars/notes.txt', modifiedAt: old },
      { key: 'workouts/../secret.webp', modifiedAt: old },
      { key: `x/${key('avatars', 1)}`, modifiedAt: old },
    ];

    expect(findOrphans(files, [], now)).toEqual([]);
  });
});
