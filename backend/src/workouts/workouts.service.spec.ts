import { NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { WorkoutService } from './workouts.service';

describe('WorkoutService exercise resolution', () => {
  const user = { id: 'user-1', email: 'u@example.com' };
  const echo = (value: unknown) => value;
  const plannedRepo = {
    create: jest.fn(echo),
    save: jest.fn((workout: unknown) => Promise.resolve(workout)),
  };
  const plannedExRepo = { create: jest.fn(echo) };
  const exerciseRepo = { find: jest.fn() };
  let service: WorkoutService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkoutService(
      plannedRepo as never,
      plannedExRepo as never,
      {} as never,
      exerciseRepo as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('loads all referenced exercises with a single query, even with repeats', async () => {
    exerciseRepo.find.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);

    const saved = await service.createPlannedWorkout(user, {
      title: 'Push',
      exercises: [
        { exerciseId: 'a' },
        { exerciseId: 'b' },
        { exerciseId: 'a' },
      ],
    });

    expect(exerciseRepo.find).toHaveBeenCalledTimes(1);
    expect(exerciseRepo.find).toHaveBeenCalledWith({
      where: { id: In(['a', 'b']) },
    });
    expect(saved).toMatchObject({
      exercises: [
        { exercise: { id: 'a' } },
        { exercise: { id: 'b' } },
        { exercise: { id: 'a' } },
      ],
    });
  });

  it('rejects the first unknown exercise and saves nothing', async () => {
    exerciseRepo.find.mockResolvedValue([{ id: 'a' }]);

    await expect(
      service.createPlannedWorkout(user, {
        title: 'Push',
        exercises: [
          { exerciseId: 'a' },
          { exerciseId: 'missing-1' },
          { exerciseId: 'missing-2' },
        ],
      }),
    ).rejects.toThrow(new NotFoundException('Exercise missing-1 not found'));
    expect(plannedRepo.save).not.toHaveBeenCalled();
  });
});

describe('WorkoutService completed workouts and progress', () => {
  const user = { id: 'user-1', email: 'u@example.com' };
  const exercise = (id: string) => ({ id, name: id.toUpperCase() });
  const badge = { id: 'badge-1', type: 'heaviest_weight' };
  const histories = new Map();
  let manager: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    delete: jest.Mock;
  };
  let exerciseRepo: { find: jest.Mock };
  let exerciseStats: { recompute: jest.Mock };
  let badges: { awardForWorkout: jest.Mock };
  let service: WorkoutService;

  beforeEach(() => {
    manager = {
      create: jest.fn((_entity: unknown, value: object) => ({ ...value })),
      save: jest.fn((workout: object) =>
        Promise.resolve({ id: 'w-1', ...workout }),
      ),
      findOne: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };
    exerciseRepo = { find: jest.fn() };
    exerciseStats = { recompute: jest.fn().mockResolvedValue(histories) };
    badges = { awardForWorkout: jest.fn().mockResolvedValue([badge]) };
    const dataSource = {
      transaction: (run: (m: typeof manager) => unknown) => run(manager),
    };

    service = new WorkoutService(
      {} as never,
      {} as never,
      {} as never,
      exerciseRepo as never,
      dataSource as never,
      exerciseStats as never,
      badges as never,
    );
  });

  it('refreshes the stats of each exercise once and returns the earned badges', async () => {
    exerciseRepo.find.mockResolvedValue([exercise('a'), exercise('b')]);

    const result = await service.createCompletedWorkout(user, {
      title: 'Push',
      completionDate: '2026-10-21T10:00:00.000Z',
      totalDurationSeconds: 3600,
      exercises: [
        { exerciseId: 'a', sets: [{ reps: 5, weight: 100 }] },
        { exerciseId: 'b', sets: [{ reps: 8, weight: 40 }] },
        { exerciseId: 'a', sets: [{ reps: 5, weight: 90 }] },
      ],
    });

    expect(exerciseStats.recompute).toHaveBeenCalledWith(manager, 'user-1', [
      'a',
      'b',
    ]);
    expect(badges.awardForWorkout).toHaveBeenCalledWith(
      manager,
      'user-1',
      expect.objectContaining({ id: 'w-1' }),
      histories,
      { replaceExisting: false },
    );
    expect(result).toMatchObject({ id: 'w-1', badges: [badge] });
  });

  it('does not save anything when an exercise is unknown', async () => {
    exerciseRepo.find.mockResolvedValue([exercise('a')]);

    await expect(
      service.createCompletedWorkout(user, {
        title: 'Push',
        completionDate: '2026-10-21T10:00:00.000Z',
        totalDurationSeconds: 3600,
        exercises: [{ exerciseId: 'ghost', sets: [] }],
      }),
    ).rejects.toThrow('Exercise ghost not found');
    expect(manager.save).not.toHaveBeenCalled();
    expect(exerciseStats.recompute).not.toHaveBeenCalled();
  });

  it('on edit, recomputes the exercises removed as well as the new ones and replaces the badges', async () => {
    manager.findOne.mockResolvedValue({
      id: 'w-1',
      completionDate: new Date('2026-10-20T10:00:00Z'),
      exercises: [{ exercise: exercise('old') }],
    });
    exerciseRepo.find.mockResolvedValue([exercise('new')]);

    await service.updateCompletedWorkout(user, 'w-1', {
      exercises: [{ exerciseId: 'new', sets: [{ reps: 5, weight: 50 }] }],
    });

    expect(manager.remove).toHaveBeenCalledWith([
      { exercise: exercise('old') },
    ]);
    expect(exerciseStats.recompute).toHaveBeenCalledWith(manager, 'user-1', [
      'old',
      'new',
    ]);
    expect(badges.awardForWorkout.mock.calls[0][4]).toEqual({
      replaceExisting: true,
    });
  });

  it('re-evaluates badges even when only the date changes', async () => {
    manager.findOne.mockResolvedValue({
      id: 'w-1',
      completionDate: new Date('2026-10-20T10:00:00Z'),
      exercises: [{ exercise: exercise('a') }],
    });

    await service.updateCompletedWorkout(user, 'w-1', {
      completionDate: '2026-09-01T10:00:00.000Z',
    });

    expect(exerciseRepo.find).not.toHaveBeenCalled();
    expect(manager.remove).not.toHaveBeenCalled();
    expect(badges.awardForWorkout.mock.calls[0][2].completionDate).toEqual(
      new Date('2026-09-01T10:00:00.000Z'),
    );
  });

  it("refuses to edit someone else's workout", async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(
      service.updateCompletedWorkout(user, 'w-x', { title: 'x' }),
    ).rejects.toThrow('Completed workout not found');
    expect(exerciseStats.recompute).not.toHaveBeenCalled();
  });

  it('on delete, rebuilds the stats of the exercises it contained', async () => {
    manager.findOne.mockResolvedValue({
      id: 'w-1',
      exercises: [{ exercise: exercise('a') }, { exercise: exercise('b') }],
    });

    await service.deleteCompletedWorkout(user, 'w-1');

    expect(manager.delete).toHaveBeenCalledWith(expect.anything(), {
      id: 'w-1',
    });
    expect(exerciseStats.recompute).toHaveBeenCalledWith(manager, 'user-1', [
      'a',
      'b',
    ]);
    expect(badges.awardForWorkout).not.toHaveBeenCalled();
  });
});
