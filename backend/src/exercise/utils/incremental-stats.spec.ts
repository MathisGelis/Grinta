import {
  detectPersonalRecords,
  previousBestsOf,
  recordsAgainst,
} from '../../badges/utils/personal-records.util';
import { SetPair } from '../../workouts/entities/completed-workout.entity';
import {
  addSession,
  buildExerciseStats,
  ExerciseSession,
  summarizeSession,
} from './exercise-history.util';

// Deterministic pseudo-random generator, so a failure can be replayed.
function generator(seed: number) {
  let state = seed;

  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function randomSets(random: () => number): SetPair[] {
  const count = Math.floor(random() * 5);

  return Array.from({ length: count }, () => {
    const kind = random();

    return {
      // Mostly loaded sets, some bodyweight, a few empty or corrupt ones.
      reps: kind < 0.05 ? 0 : 1 + Math.floor(random() * 15),
      weight:
        kind < 0.25 ? 0 : kind < 0.28 ? -5 : Math.round(random() * 400) / 4,
    };
  });
}

function randomHistory(random: () => number): ExerciseSession[] {
  const count = 1 + Math.floor(random() * 8);
  const base = Date.UTC(2026, 0, 1);

  return Array.from({ length: count }, (_, i) => ({
    workoutId: `w${i}`,
    // Few distinct days, so equal completion dates are frequent.
    completedAt: new Date(base + Math.floor(random() * 5) * 86_400_000),
    createdAt: new Date(base + i * 1000),
    sets: randomSets(random),
  }));
}

describe('incremental stats and records', () => {
  it('adding a new session to the stored stats equals rebuilding from the whole history', () => {
    const random = generator(42);
    let compared = 0;

    for (let i = 0; i < 5000; i++) {
      const history = randomHistory(random);
      const previous = history.slice(0, -1);
      const added = history[history.length - 1];
      const stored = buildExerciseStats(previous);

      if (!stored) continue;
      const expected = buildExerciseStats(history);
      const actual = addSession(stored, added.sets, added.completedAt);

      // lastWorkoutId is not stored, so it is not part of the comparison.
      expect({ ...actual, lastWorkoutId: null }).toEqual({
        ...expected,
        lastWorkoutId: null,
      });
      compared++;
    }
    expect(compared).toBeGreaterThan(3000);
  });

  it('judging a new session against the stored stats awards the same records', () => {
    const random = generator(7);
    let awarded = 0;

    for (let i = 0; i < 5000; i++) {
      const history = randomHistory(random);
      const previous = history.slice(0, -1);
      const added = history[history.length - 1];
      const stored = buildExerciseStats(previous);

      if (!stored) continue;
      const expected = detectPersonalRecords(history, added.workoutId);
      const actual = recordsAgainst(
        summarizeSession(added.sets),
        previousBestsOf(stored),
      );

      expect(actual).toEqual(expected);
      awarded += actual.length;
    }
    expect(awarded).toBeGreaterThan(500);
  });

  it('keeps the stored stats when the new session has no valid set', () => {
    const stored = buildExerciseStats([
      {
        workoutId: 'w1',
        completedAt: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
        sets: [{ reps: 5, weight: 100 }],
      },
    ]);

    expect(
      addSession(stored!, [{ reps: 0, weight: 50 }], new Date('2026-02-01')),
    ).toBe(stored);
  });
});
