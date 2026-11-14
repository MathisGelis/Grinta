import { CompletedWorkout } from '../workouts/entities/completed-workout.entity';
import { PlannedWorkout } from '../workouts/entities/planned-workout.entity';
import { ProgressionMetric } from './dto/progression-query.dto';
import { StatsCalculatorService } from './stats-calculator.service';
import { BestSetRow, PeriodTotals } from './stats.types';

const calc = new StatsCalculatorService();
const set = (reps: number, weight: number) => ({ reps, weight });
const date = (iso: string) => new Date(iso);

describe('progression', () => {
  const rows = [
    { day: '2026-03-02', workoutId: 'w2', sets: [set(5, 100), set(5, 100)] },
    { day: '2026-03-01', workoutId: 'w1', sets: [set(10, 60), set(8, 70)] },
    // same day as w1: both workouts are merged into one point
    { day: '2026-03-01', workoutId: 'w1b', sets: [set(3, 80)] },
    // nothing to track: bodyweight set and an empty exercise
    { day: '2026-03-03', workoutId: 'w3', sets: [set(15, 0)] },
    { day: '2026-03-04', workoutId: 'w4', sets: null },
  ];

  it('returns one point per loaded day, oldest first, ignoring unloaded sets', () => {
    const points = calc.progressionPoints(rows, ProgressionMetric.VOLUME);

    expect(points.map((p) => p.date)).toEqual(['2026-03-01', '2026-03-02']);
  });

  it('sums reps x weight for the volume metric', () => {
    const [day1, day2] = calc.progressionPoints(rows, ProgressionMetric.VOLUME);

    // 10x60 + 8x70 + 3x80 = 600 + 560 + 240
    expect(day1.value).toBe(1400);
    expect(day1.sets).toBe(3);
    expect(day1.workoutIds.sort()).toEqual(['w1', 'w1b']);
    expect(day2.value).toBe(1000);
  });

  it('takes the best Epley estimate of the day for the 1rm metric', () => {
    const [day1, day2] = calc.progressionPoints(
      rows,
      ProgressionMetric.ONE_REP_MAX,
    );

    // 60x10 = 80, 70x8 = 88.67, 80x3 = 88 -> the 70x8 set wins
    expect(day1.value).toBe(88.67);
    expect(day1.bestSet).toEqual({ reps: 8, weight: 70 });
    // 100x5 = 116.67
    expect(day2.value).toBe(116.67);
  });

  it('summarises an empty series without inventing numbers', () => {
    expect(calc.summarizeProgression([])).toEqual({
      points: 0,
      first: null,
      latest: null,
      best: null,
      change: 0,
      changePct: 0,
      trend: null,
    });
  });

  it('has no trend with a single point', () => {
    const points = calc.progressionPoints([rows[0]], ProgressionMetric.VOLUME);

    expect(calc.summarizeProgression(points).trend).toBeNull();
  });

  it.each([
    [[100, 110, 130], 'up', 30],
    [[130, 110, 100], 'down', -23.1],
    [[100, 130, 102], 'flat', 2],
  ])('reports the trend of %p as %s', (values, trend, changePct) => {
    const points = values.map((value, i) => ({
      date: `2026-03-0${i + 1}`,
      value,
      sets: 1,
      bestSet: set(5, 50),
      workoutIds: [],
    }));
    const summary = calc.summarizeProgression(points);

    expect(summary.trend).toBe(trend);
    expect(summary.changePct).toBe(changePct);
    expect(summary.best?.value).toBe(Math.max(...values));
  });

  it('smooths the trend over up to three points at each end', () => {
    // a single bad last day must not flip an otherwise rising series
    const points = [100, 105, 110, 120, 125, 130, 90].map((value, i) => ({
      date: `2026-03-0${i + 1}`,
      value,
      sets: 1,
      bestSet: set(5, 50),
      workoutIds: [],
    }));

    // early avg 105, late avg (125 + 130 + 90) / 3 = 115 -> +9.5%
    expect(calc.progressionTrend(points)).toBe('up');
  });
});

describe('exerciseRecords', () => {
  const bench = { exerciseId: 'bench', name: 'Bench', primaryMuscle: 'chest' };
  const squat = { exerciseId: 'squat', name: 'Squat', primaryMuscle: 'quads' };
  const row = (base: object, reps: number, weight: number, at: string) =>
    ({ ...base, reps, weight, achievedAt: date(at) }) as BestSetRow;

  it('finds the best 1RM across rep counts, not the heaviest weight', () => {
    const records = calc.exerciseRecords(
      [
        row(bench, 5, 100, '2026-01-10'), // 116.67
        row(bench, 3, 110, '2026-02-10'), // 121.00
        row(bench, 1, 115, '2026-03-10'), // 118.83
      ],
      [],
    );

    expect(records).toHaveLength(1);
    expect(records[0].estimatedOneRepMax).toMatchObject({
      value: 121,
      weight: 110,
      reps: 3,
    });
    expect(records[0].heaviestWeight).toMatchObject({ weight: 115, reps: 1 });
  });

  it('breaks a heaviest-weight tie by reps, then by the earliest date', () => {
    const [record] = calc.exerciseRecords(
      [
        row(bench, 2, 100, '2026-05-01'),
        row(bench, 4, 100, '2026-06-01'),
        row(bench, 4, 100, '2026-04-01'),
      ],
      [],
    );

    expect(record.heaviestWeight).toMatchObject({ reps: 4 });
    // two identical estimates: the one reached first keeps the record
    expect(record.estimatedOneRepMax.achievedAt).toEqual(date('2026-04-01'));
  });

  it('attaches the best session volume and sorts by 1RM, then by name', () => {
    const records = calc.exerciseRecords(
      [row(bench, 5, 100, '2026-01-10'), row(squat, 5, 140, '2026-01-12')],
      [
        {
          exerciseId: 'squat',
          workoutId: 'w9',
          volume: 4200.456,
          achievedAt: date('2026-01-12'),
        },
      ],
    );

    expect(records.map((r) => r.exerciseId)).toEqual(['squat', 'bench']);
    expect(records[0].bestSessionVolume).toEqual({
      value: 4200.46,
      workoutId: 'w9',
      achievedAt: date('2026-01-12'),
    });
    expect(records[1].bestSessionVolume).toBeNull();
  });

  it('ignores sets without weight or reps', () => {
    expect(
      calc.exerciseRecords(
        [row(bench, 0, 100, '2026-01-01'), row(bench, 10, 0, '2026-01-02')],
        [],
      ),
    ).toEqual([]);
  });
});

describe('computeAdherence', () => {
  const exercise = (id: string) => ({ id, name: id.toUpperCase() });
  const planned = (
    ...entries: Array<[string, Array<{ reps: number; weight: number }>?]>
  ) =>
    ({
      id: 'plan',
      title: 'Push',
      exercises: entries.map(([id, sets]) => ({
        exercise: exercise(id),
        sets,
      })),
    }) as unknown as PlannedWorkout;
  const completed = (
    ...entries: Array<[string, Array<{ reps: number; weight: number }>?]>
  ) =>
    ({
      id: 'done',
      title: 'Push day',
      exercises: entries.map(([id, sets]) => ({
        exercise: exercise(id),
        sets,
      })),
    }) as unknown as CompletedWorkout;

  it('scores a session that did everything as full', () => {
    const result = calc.computeAdherence(
      planned(['a', [set(10, 50), set(10, 50)]]),
      completed(['a', [set(10, 50), set(10, 50)]]),
    );

    expect(result.score).toBe(100);
    expect(result.rating).toBe('full');
    expect(result.exercises[0]).toMatchObject({
      status: 'completed',
      setAdherencePct: 100,
      volumeAdherencePct: 100,
    });
  });

  it('classifies each exercise and reports extras', () => {
    const result = calc.computeAdherence(
      planned(
        ['a', [set(10, 50), set(10, 50), set(10, 50), set(10, 50)]],
        ['b', [set(8, 60), set(8, 60)]],
        ['c', [set(12, 20)]],
        ['d', [set(5, 100)]],
      ),
      completed(
        ['a', [set(10, 50), set(10, 50)]], // partial: 2 of 4
        ['b', [set(8, 60), set(8, 60), set(8, 60)]], // exceeded
        // c skipped
        ['d', [set(5, 100)]], // completed
        ['e', [set(15, 10)]], // not planned
      ),
    );

    expect(result.exercises.map((e) => e.status)).toEqual([
      'partial',
      'exceeded',
      'skipped',
      'completed',
    ]);
    expect(result.extras).toEqual([
      { exerciseId: 'e', name: 'E', sets: 1, reps: 15, volume: 150 },
    ]);
    expect(result.totals).toMatchObject({
      exercisesPlanned: 4,
      exercisesCompleted: 2,
      exercisesPartial: 1,
      exercisesSkipped: 1,
      extraExercises: 1,
      setsPlanned: 8,
      // a: 2, b: capped at its 2 planned sets, c: 0, d: 1
      setsCompleted: 5,
    });
    expect(result.score).toBe(62.5);
    expect(result.rating).toBe('partial');
  });

  it('does not let extra sets on one exercise hide a skipped one', () => {
    const result = calc.computeAdherence(
      planned(['a', [set(5, 50)]], ['b', [set(5, 50)]]),
      completed(['a', [set(5, 50), set(5, 50), set(5, 50)]]),
    );

    expect(result.score).toBe(50);
    expect(result.exercises[0].setAdherencePct).toBe(100);
    expect(result.exercises[1].status).toBe('skipped');
  });

  it('merges the same exercise appearing twice on each side', () => {
    const result = calc.computeAdherence(
      planned(['a', [set(5, 50)]], ['a', [set(5, 50)]]),
      completed(['a', [set(5, 50)]], ['a', [set(5, 50)]]),
    );

    expect(result.exercises).toHaveLength(1);
    expect(result.exercises[0]).toMatchObject({
      plannedSets: 2,
      completedSets: 2,
    });
  });

  it('falls back to exercise completion when the plan has no sets', () => {
    const result = calc.computeAdherence(
      planned(['a'], ['b']),
      completed(['a', [set(10, 20)]]),
    );

    expect(result.score).toBe(50);
    expect(result.exercises[0]).toMatchObject({
      status: 'completed',
      volumeAdherencePct: null,
    });
    expect(result.exercises[1].status).toBe('skipped');
  });

  it('has no score for an empty plan', () => {
    const result = calc.computeAdherence(
      planned(),
      completed(['a', [set(5, 5)]]),
    );

    expect(result.score).toBeNull();
    expect(result.rating).toBeNull();
    expect(result.extras).toHaveLength(1);
  });

  it.each([
    [100, 'full'],
    [80, 'high'],
    [79.9, 'partial'],
    [50, 'partial'],
    [49.9, 'low'],
  ])('rates a score of %s as %s', (done, rating) => {
    // 1000 planned sets scaled so that `done` of them are completed
    const planSets = Array.from({ length: 1000 }, () => set(1, 1));
    const doneSets = Array.from({ length: Math.round(done * 10) }, () =>
      set(1, 1),
    );

    expect(
      calc.computeAdherence(
        planned(['a', planSets]),
        completed(['a', doneSets]),
      ).rating,
    ).toBe(rating);
  });
});

describe('comparison against the personal baseline', () => {
  const totals = (workouts: number, volume: number): PeriodTotals => ({
    workouts,
    durationSeconds: workouts * 3600,
    sets: workouts * 20,
    reps: workouts * 200,
    volume,
    calories: workouts * 300,
  });

  it('averages every metric over the baseline periods', () => {
    expect(calc.averageTotals([totals(2, 1000), totals(4, 3000)])).toEqual({
      workouts: 3,
      durationSeconds: 10800,
      sets: 60,
      reps: 600,
      volume: 2000,
      calories: 900,
    });
  });

  it('compares a completed period with the full average', () => {
    const average = calc.averageTotals([totals(4, 2000), totals(4, 2000)]);
    const result = calc.compareToBaseline(totals(5, 2300), average, 1);

    expect(result.workouts).toMatchObject({
      current: 5,
      baselineAverage: 4,
      expectedByNow: 4,
      changePct: 25,
      verdict: 'above',
    });
    expect(result.volume).toMatchObject({ changePct: 15, verdict: 'above' });
  });

  it('pro-rates the baseline by the elapsed share of the period', () => {
    const average = calc.averageTotals([totals(4, 2000)]);
    // halfway through the week, 2 workouts is exactly on pace for 4
    const result = calc.compareToBaseline(totals(2, 1000), average, 0.5);

    expect(result.workouts).toMatchObject({
      baselineAverage: 4,
      expectedByNow: 2,
      changePct: 0,
      verdict: 'on_track',
    });
  });

  it.each([
    [105, 'on_track'],
    [95, 'on_track'],
    [105.1, 'above'],
    [94.9, 'below'],
  ])('treats %s%% of the baseline as %s', (pct, verdict) => {
    const average = calc.averageTotals([totals(10, 1000)]);
    const result = calc.compareToBaseline(totals(10, pct * 10), average, 1);

    expect(result.volume.verdict).toBe(verdict);
  });

  it('reports unknown everywhere when there is no baseline', () => {
    const result = calc.compareToBaseline(totals(3, 900), null, 1);

    expect(Object.values(result).every((m) => m.verdict === 'unknown')).toBe(
      true,
    );
    expect(result.workouts).toMatchObject({
      current: 3,
      baselineAverage: null,
      changePct: null,
    });
  });

  it('writes insights that mention the elapsed part of the period', () => {
    const average = calc.averageTotals([totals(4, 2000)]);
    const comparison = calc.compareToBaseline(totals(3, 1500), average, 0.5);
    const insights = calc.comparisonInsights(comparison, 8, 'week', 0.5);

    expect(insights).toEqual([
      'Workouts are 50% above your usual week (last 8) so far this week.',
      'Training volume is 50% above your usual week (last 8) so far this week.',
    ]);
  });

  it('says so when there is nothing to compare with', () => {
    expect(calc.comparisonInsights({}, 0, 'week', 1)).toEqual([
      'Not enough history yet to compare with your usual routine.',
    ]);
  });
});

describe('breakdownSlices', () => {
  it('computes each type share of the sets and sorts by sets', () => {
    expect(
      calc.breakdownSlices([
        { type: 'bodyweight_reps', exercises: 2, sets: 10, volume: 0 },
        { type: 'weight_reps', exercises: 5, sets: 30, volume: 12345.678 },
      ]),
    ).toEqual([
      {
        type: 'weight_reps',
        exercises: 5,
        sets: 30,
        volume: 12345.68,
        percentageOfSets: 75,
      },
      {
        type: 'bodyweight_reps',
        exercises: 2,
        sets: 10,
        volume: 0,
        percentageOfSets: 25,
      },
    ]);
  });

  it('does not divide by zero on an empty period', () => {
    expect(calc.breakdownSlices([])).toEqual([]);
    expect(
      calc.breakdownSlices([{ type: 'x', exercises: 0, sets: 0, volume: 0 }])[0]
        .percentageOfSets,
    ).toBe(0);
  });
});

describe('heatmapDays', () => {
  it('scales the level to the longest day and keeps days in order', () => {
    const days = calc.heatmapDays([
      { day: '2026-02-01', workouts: 1, durationSeconds: 1800 },
      { day: '2026-01-01', workouts: 1, durationSeconds: 7200 },
      { day: '2026-03-01', workouts: 2, durationSeconds: 3600 },
      { day: '2026-04-01', workouts: 1, durationSeconds: 100 },
    ]);

    expect(days.map((d) => d.date)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
      '2026-04-01',
    ]);
    // longest day is level 4, half of it is 2, a quarter is 1, a sliver stays 1
    expect(days.map((d) => d.level)).toEqual([4, 1, 2, 1]);
  });

  it('gives every active day at least level 1, even without a duration', () => {
    expect(
      calc.heatmapDays([
        { day: '2026-01-01', workouts: 1, durationSeconds: 0 },
      ])[0].level,
    ).toBe(1);
  });

  it('puts equal days at the top level', () => {
    const days = calc.heatmapDays([
      { day: '2026-01-01', workouts: 1, durationSeconds: 3600 },
      { day: '2026-01-02', workouts: 1, durationSeconds: 3600 },
    ]);

    expect(days.map((d) => d.level)).toEqual([4, 4]);
  });
});
