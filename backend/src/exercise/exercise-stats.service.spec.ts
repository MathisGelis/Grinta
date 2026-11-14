import { BadgeType } from '../badges/enums/badge-type.enum';
import { ExerciseStatsService } from './exercise-stats.service';

describe('ExerciseStatsService.addWorkout', () => {
  const workout = { id: 'w-new', completionDate: new Date('2026-10-20') };
  const storedRow = {
    exercise_id: 'bench',
    PR: 100,
    pr_reps: 5,
    best_estimated_1rm: 116.67,
    best_session_volume: 1500,
    max_reps: null,
    last_reps: 5,
    last_weight: 100,
    last_sets: [{ reps: 5, weight: 100 }],
    last_performed_at: new Date('2026-10-10'),
    total_sessions: 4,
    total_sets: 12,
    total_reps: 60,
    total_volume: 5000,
  };
  let insertedValues: unknown[];
  let manager: { query: jest.Mock; createQueryBuilder: jest.Mock };
  const service = new ExerciseStatsService({} as never);

  beforeEach(() => {
    insertedValues = [];
    const insert = {
      insert: () => insert,
      into: () => insert,
      values: (values: unknown[]) => {
        insertedValues.push(...values);
        return insert;
      },
      orUpdate: () => insert,
      execute: jest.fn(),
    };

    manager = {
      query: jest.fn().mockResolvedValue([storedRow]),
      createQueryBuilder: jest.fn(() => insert),
    };
  });

  it('locks the stored stats, adds the session to them and judges it against them', async () => {
    const result = await service.addWorkout(manager as never, 'u1', workout, [
      { id: 'bench', name: 'Bench', sets: [{ reps: 5, weight: 105 }] },
      { id: 'bench', name: 'Bench', sets: [{ reps: 8, weight: 80 }] },
    ]);

    expect(manager.query).toHaveBeenCalledTimes(1);
    expect(manager.query.mock.calls[0][0]).toContain('FOR UPDATE');
    expect(manager.query.mock.calls[0][1]).toEqual(['u1', ['bench']]);
    expect(insertedValues).toEqual([
      expect.objectContaining({
        exercise: { id: 'bench' },
        PR: 105,
        pr_reps: 5,
        total_sessions: 5,
        total_sets: 14,
        total_reps: 73,
        total_volume: 5000 + 525 + 640,
        last_weight: 105,
        last_performed_at: workout.completionDate,
      }),
    ]);
    expect(result).toEqual([
      {
        exerciseId: 'bench',
        exerciseName: 'Bench',
        records: [
          expect.objectContaining({
            type: BadgeType.HEAVIEST_WEIGHT,
            value: 105,
            previousValue: 100,
          }),
          expect.objectContaining({ type: BadgeType.BEST_ESTIMATED_1RM }),
        ],
      },
    ]);
  });

  it('rebuilds an exercise without stored stats from its history', async () => {
    manager.query.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        exerciseId: 'squat',
        exerciseName: 'Squat',
        workoutId: 'w-new',
        completedAt: workout.completionDate,
        createdAt: workout.completionDate,
        sets: [{ reps: 5, weight: 120 }],
      },
    ]);

    const result = await service.addWorkout(manager as never, 'u1', workout, [
      { id: 'squat', name: 'Squat', sets: [{ reps: 5, weight: 120 }] },
    ]);

    expect(manager.query).toHaveBeenCalledTimes(2);
    expect(insertedValues).toEqual([
      expect.objectContaining({ exercise: { id: 'squat' }, PR: 120 }),
    ]);
    expect(result).toEqual([
      { exerciseId: 'squat', exerciseName: 'Squat', records: [] },
    ]);
  });
});
