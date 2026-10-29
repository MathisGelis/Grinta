import { bestSetOf, summarizeWorkout } from './workout-summary';

describe('bestSetOf', () => {
  it('keeps the heaviest set, with most reps between equal weights', () => {
    expect(
      bestSetOf([
        { reps: 10, weight: 60 },
        { reps: 6, weight: 80 },
        { reps: 8, weight: 80 },
        { reps: 12, weight: 70 },
      ]),
    ).toEqual({ reps: 8, weight: 80 });
  });

  it('keeps the set with most reps for a bodyweight exercise', () => {
    expect(
      bestSetOf([
        { reps: 12, weight: 0 },
        { reps: 15, weight: 0 },
      ]),
    ).toEqual({ reps: 15, weight: 0 });
  });

  it('has no best set without sets', () => {
    expect(bestSetOf([])).toBeNull();
    expect(bestSetOf(null)).toBeNull();
  });
});

describe('summarizeWorkout', () => {
  it('summarizes each exercise and totals the session', () => {
    const summary = summarizeWorkout(
      [
        {
          exerciseId: 'bench',
          name: 'Bench Press (Barbell)',
          sets: [
            { reps: 8, weight: 80 },
            { reps: 6, weight: 85 },
          ],
        },
        { exerciseId: 'dip', name: 'Chest Dip (Bodyweight)', sets: null },
      ],
      3_600,
      2,
    );

    expect(summary).toEqual({
      exercises: [
        {
          exerciseId: 'bench',
          name: 'Bench Press (Barbell)',
          sets: 2,
          bestSet: { reps: 6, weight: 85 },
        },
        {
          exerciseId: 'dip',
          name: 'Chest Dip (Bodyweight)',
          sets: 0,
          bestSet: null,
        },
      ],
      stats: {
        durationSeconds: 3_600,
        totalVolume: 1_150,
        totalSets: 2,
        totalReps: 14,
        recordsCount: 2,
      },
    });
  });
});
