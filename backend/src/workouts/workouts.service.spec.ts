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
      {} as never,
      exerciseRepo as never,
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
