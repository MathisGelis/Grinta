import { DetailedMuscleGroup as M } from '../../exercise/enums/detailed-muscle.enum';
import { rankByNeglectedMuscles } from './workout-suggestion';

const targets = (entries: Array<[M, number]>) => new Map(entries);

describe('rankByNeglectedMuscles', () => {
  const push = {
    id: 'push',
    targets: targets([
      [M.MIDDLE_CHEST, 8],
      [M.TRICEPS, 6],
    ]),
  };
  const legs = {
    id: 'legs',
    targets: targets([
      [M.QUADS, 9],
      [M.HAMSTRINGS, 4],
    ]),
  };

  it('puts first the workout for the muscles not trained this period', () => {
    const worked = new Map([
      [M.MIDDLE_CHEST, 12],
      [M.TRICEPS, 8],
    ]);
    const [first, second] = rankByNeglectedMuscles(worked, [push, legs]);

    expect(first).toMatchObject({ id: 'legs', score: 1 });
    expect(second.id).toBe('push');
    expect(second.score).toBeLessThan(0.15);
  });

  it('weighs each muscle by how much the workout works it', () => {
    // Chest untouched but only 2 sets of it; quads trained but 10 sets.
    const mostlyQuads = {
      id: 'a',
      targets: targets([
        [M.QUADS, 10],
        [M.MIDDLE_CHEST, 2],
      ]),
    };
    const mostlyChest = {
      id: 'b',
      targets: targets([
        [M.MIDDLE_CHEST, 10],
        [M.QUADS, 2],
      ]),
    };
    const worked = new Map([[M.QUADS, 9]]);

    expect(
      rankByNeglectedMuscles(worked, [mostlyQuads, mostlyChest])[0].id,
    ).toBe('b');
  });

  it('lists the muscles of a workout, the least trained first', () => {
    const worked = new Map([[M.QUADS, 4]]);
    const [legsRanked] = rankByNeglectedMuscles(worked, [legs]);

    expect(legsRanked.muscles).toEqual([
      { muscle: M.HAMSTRINGS, plannedSets: 4, workedSets: 0 },
      { muscle: M.QUADS, plannedSets: 9, workedSets: 4 },
    ]);
  });

  it('breaks ties by size then id, and leaves out empty workouts', () => {
    const small = { id: 'small', targets: targets([[M.BICEPS, 3]]) };
    const big = { id: 'big', targets: targets([[M.LATS, 9]]) };
    const empty = { id: 'empty', targets: new Map() };

    expect(
      rankByNeglectedMuscles(new Map(), [small, empty, big]).map((w) => w.id),
    ).toEqual(['big', 'small']);
  });
});
