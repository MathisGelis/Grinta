import { ExerciseSession } from '../../exercise/utils/exercise-history.util';
import { BadgeType } from '../enums/badge-type.enum';
import { detectPersonalRecords } from './personal-records.util';

const set = (reps: number, weight: number) => ({ reps, weight });
const session = (
  workoutId: string,
  sets: Array<{ reps: number; weight: number }>,
  day = '2026-01-01',
): ExerciseSession => ({
  workoutId,
  completedAt: new Date(`${day}T18:00:00Z`),
  createdAt: new Date(`${day}T19:00:00Z`),
  sets,
});
const types = (records: Array<{ type: BadgeType }>) =>
  records.map((r) => r.type).sort();

describe('detectPersonalRecords', () => {
  const history = [
    session('w1', [set(10, 60), set(10, 60), set(10, 60)]),
    session('w2', [set(5, 80), set(5, 80)]),
  ];

  it('awards nothing on the first session of an exercise', () => {
    expect(
      detectPersonalRecords([session('first', [set(5, 100)])], 'first'),
    ).toEqual([]);
  });

  it('awards nothing when the workout does not contain the exercise', () => {
    expect(detectPersonalRecords(history, 'other')).toEqual([]);
  });

  it('awards every record a heavier, bigger session beats', () => {
    const records = detectPersonalRecords(
      [
        ...history,
        session(
          'new',
          Array.from({ length: 5 }, () => set(5, 90)),
        ),
      ],
      'new',
    );

    expect(types(records)).toEqual([
      BadgeType.BEST_ESTIMATED_1RM,
      BadgeType.BEST_SESSION_VOLUME,
      BadgeType.HEAVIEST_WEIGHT,
    ]);
    expect(records.find((r) => r.type === BadgeType.HEAVIEST_WEIGHT)).toEqual({
      type: BadgeType.HEAVIEST_WEIGHT,
      value: 90,
      previousValue: 80,
      weight: 90,
      reps: 5,
    });
    // 5 x 5 x 90 = 2250 against w1's 3 x 10 x 60 = 1800
    expect(
      records.find((r) => r.type === BadgeType.BEST_SESSION_VOLUME),
    ).toMatchObject({ value: 2250, previousValue: 1800 });
  });

  it('does not award a volume that only ties the record', () => {
    // 4 x 5 x 90 = 1800, exactly w1's volume
    const records = detectPersonalRecords(
      [
        ...history,
        session(
          'tie',
          Array.from({ length: 4 }, () => set(5, 90)),
        ),
      ],
      'tie',
    );

    expect(types(records)).toEqual([
      BadgeType.BEST_ESTIMATED_1RM,
      BadgeType.HEAVIEST_WEIGHT,
    ]);
  });

  it('never awards a tie', () => {
    const records = detectPersonalRecords(
      [...history, session('same', [set(5, 80)])],
      'same',
    );

    expect(records).toEqual([]);
  });

  it('awards a better 1RM at the same top weight without a heaviest-weight badge', () => {
    const records = detectPersonalRecords(
      [...history, session('reps', [set(8, 80)])],
      'reps',
    );

    expect(types(records)).toEqual([BadgeType.BEST_ESTIMATED_1RM]);
    expect(records[0]).toMatchObject({
      // 80 x 8 -> 101.33 against 80 x 5 -> 93.33
      value: 101.33,
      previousValue: 93.33,
      weight: 80,
      reps: 8,
    });
  });

  it('awards a volume record with lighter weights', () => {
    const records = detectPersonalRecords(
      [
        ...history,
        session(
          'volume',
          Array.from({ length: 6 }, () => set(10, 50)),
        ),
      ],
      'volume',
    );

    expect(types(records)).toEqual([BadgeType.BEST_SESSION_VOLUME]);
    expect(records[0]).toMatchObject({
      value: 3000,
      previousValue: 1800,
      weight: null,
      reps: null,
    });
  });

  it('awards a reps record on bodyweight sets', () => {
    const records = detectPersonalRecords(
      [
        session('a', [set(12, 0), set(10, 0)]),
        session('b', [set(14, 0)]),
        session('c', [set(16, 0), set(8, 0)]),
      ],
      'c',
    );

    expect(records).toEqual([
      {
        type: BadgeType.MOST_REPS,
        value: 16,
        previousValue: 14,
        weight: 0,
        reps: 16,
      },
    ]);
  });

  it('does not count the first loaded set after bodyweight-only sessions', () => {
    const records = detectPersonalRecords(
      [session('a', [set(12, 0)]), session('b', [set(8, 10)])],
      'b',
    );

    expect(records).toEqual([]);
  });

  it('compares against later workouts too, whatever the date', () => {
    // logging an old session after the fact: it must beat the later ones
    const records = detectPersonalRecords(
      [
        session('later', [set(5, 100)], '2026-03-01'),
        session('backdated', [set(5, 95)], '2026-01-01'),
      ],
      'backdated',
    );

    expect(records).toEqual([]);
  });

  it('merges the exercise when it appears twice in the same workout', () => {
    const records = detectPersonalRecords(
      [
        session('old', [set(10, 50), set(10, 50)]),
        session('twice', [set(10, 50)]),
        session('twice', [set(10, 50), set(10, 50)]),
      ],
      'twice',
    );

    expect(types(records)).toEqual([BadgeType.BEST_SESSION_VOLUME]);
    expect(records[0]).toMatchObject({ value: 1500, previousValue: 1000 });
  });
});
