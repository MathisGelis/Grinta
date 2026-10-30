import {
  buildExerciseStats,
  ExerciseSession,
  summarizeSession,
  validSets,
} from './exercise-history.util';

const set = (reps: number, weight: number) => ({ reps, weight });
const session = (
  workoutId: string,
  day: string,
  sets: Array<{ reps: number; weight: number }>,
  createdAt = `${day}T20:00:00Z`,
): ExerciseSession => ({
  workoutId,
  completedAt: new Date(`${day}T18:00:00Z`),
  createdAt: new Date(createdAt),
  sets,
});

describe('validSets', () => {
  it('keeps bodyweight sets and drops empty or corrupt ones', () => {
    expect(
      validSets([
        set(10, 0),
        set(0, 50),
        set(5, -10),
        { reps: NaN, weight: 10 },
        null as never,
        set(8, 60),
      ]),
    ).toEqual([set(10, 0), set(8, 60)]);
  });

  it('accepts a missing list', () => {
    expect(validSets(null)).toEqual([]);
  });
});

describe('summarizeSession', () => {
  it('summarises a loaded session', () => {
    const summary = summarizeSession([
      set(10, 60),
      set(8, 70),
      set(3, 80),
      set(5, 80),
    ]);

    expect(summary).toMatchObject({
      sets: 4,
      reps: 26,
      // 600 + 560 + 240 + 400
      volume: 1800,
      heaviestWeight: 80,
      repsAtHeaviest: 5,
      // 80 x 5 -> 93.33 beats 70 x 8 -> 88.67
      bestEstimatedOneRepMax: 93.33,
      bestSet: set(5, 80),
      maxUnloadedReps: 0,
      topSet: set(5, 80),
    });
  });

  it('tracks reps, not load, for a bodyweight session', () => {
    expect(summarizeSession([set(12, 0), set(15, 0), set(9, 0)])).toEqual({
      sets: 3,
      reps: 36,
      volume: 0,
      heaviestWeight: 0,
      repsAtHeaviest: 0,
      bestEstimatedOneRepMax: 0,
      bestSet: null,
      maxUnloadedReps: 15,
      topSet: set(15, 0),
    });
  });

  it('returns an empty summary for a session without valid sets', () => {
    expect(summarizeSession([])).toMatchObject({
      sets: 0,
      heaviestWeight: 0,
      bestSet: null,
      topSet: null,
    });
  });
});

describe('buildExerciseStats', () => {
  it('returns null without any valid set, so the stored row is dropped', () => {
    expect(buildExerciseStats([])).toBeNull();
    expect(buildExerciseStats([session('w1', '2026-01-01', [])])).toBeNull();
  });

  it('aggregates totals and personal bests across sessions', () => {
    const stats = buildExerciseStats([
      session('w1', '2026-01-01', [set(10, 60), set(10, 60)]),
      session('w2', '2026-01-08', [set(5, 80), set(3, 85)]),
      session('w3', '2026-01-15', [set(8, 70), set(8, 70), set(8, 70)]),
    ]);

    expect(stats).toMatchObject({
      totalSessions: 3,
      totalSets: 7,
      totalReps: 52,
      // 1200 + 655 + 1680
      totalVolume: 3535,
      prWeight: 85,
      prReps: 3,
      // 85 x 3 = 93.5 beats 80 x 5 = 93.33
      bestEstimatedOneRepMax: 93.5,
      bestSessionVolume: 1680,
      maxReps: null,
    });
  });

  it('keeps the most reps ever done at the record weight', () => {
    const stats = buildExerciseStats([
      session('w1', '2026-01-01', [set(2, 100)]),
      session('w2', '2026-01-08', [set(4, 100), set(1, 90)]),
    ]);

    expect(stats).toMatchObject({ prWeight: 100, prReps: 4 });
  });

  it('takes the top set of the most recent session as the last performance', () => {
    const stats = buildExerciseStats([
      session('recent', '2026-02-01', [set(10, 50), set(6, 60), set(8, 60)]),
      session('older', '2026-01-01', [set(5, 100)]),
    ]);

    expect(stats).toMatchObject({
      lastWorkoutId: 'recent',
      lastWeight: 60,
      lastReps: 8,
      lastSets: [set(10, 50), set(6, 60), set(8, 60)],
      lastPerformedAt: new Date('2026-02-01T18:00:00Z'),
    });
  });

  it('breaks a same-time tie with the creation date', () => {
    const stats = buildExerciseStats([
      session('first', '2026-02-01', [set(5, 50)], '2026-02-01T19:00:00Z'),
      session('second', '2026-02-01', [set(5, 55)], '2026-02-01T21:00:00Z'),
    ]);

    expect(stats?.lastWorkoutId).toBe('second');
  });

  it('ignores a later session without valid sets when picking the last one', () => {
    const stats = buildExerciseStats([
      session('done', '2026-02-01', [set(5, 50)]),
      session('empty', '2026-03-01', [set(0, 50)]),
    ]);

    expect(stats).toMatchObject({ lastWorkoutId: 'done', totalSessions: 1 });
  });

  it('reports reps for a bodyweight exercise and no load records', () => {
    const stats = buildExerciseStats([
      session('w1', '2026-01-01', [set(12, 0), set(10, 0)]),
      session('w2', '2026-01-03', [set(15, 0)]),
    ]);

    expect(stats).toMatchObject({
      prWeight: null,
      prReps: null,
      bestEstimatedOneRepMax: null,
      bestSessionVolume: null,
      maxReps: 15,
      lastWeight: 0,
      lastReps: 15,
      totalVolume: 0,
    });
  });
});

describe('decimal weights', () => {
  it('keeps 62.5 kg exact in volume, 1RM and records', () => {
    expect(summarizeSession([set(7, 62.5), set(5, 65)])).toMatchObject({
      // 437.5 + 325
      volume: 762.5,
      heaviestWeight: 65,
      // 62.5 x (1 + 7/30) = 77.08 beats 65 x (1 + 5/30) = 75.83
      bestEstimatedOneRepMax: 77.08,
      bestSet: set(7, 62.5),
    });

    const stats = buildExerciseStats([
      session('w1', '2026-10-28', [set(7, 62.5)]),
      session('w2', '2026-10-30', [set(5, 61.25)]),
    ]);

    expect(stats).toMatchObject({
      prWeight: 62.5,
      prReps: 7,
      bestEstimatedOneRepMax: 77.08,
      totalVolume: 743.75,
      lastWeight: 61.25,
    });
  });
});
