import { NotFoundException } from '@nestjs/common';
import { Difficulty } from './enums/difficulty.enum';
import { LocationType } from './enums/location-type.enum';
import { ProgrammesService } from './programmes.service';

describe('ProgrammesService day building', () => {
  const user = { id: 'user-1', email: 'u@example.com' };
  const echo = (value: unknown) => value;
  const programmeRepo = {
    create: jest.fn(echo),
    save: jest.fn((programme: unknown) => Promise.resolve(programme)),
  };
  const dayRepo = { create: jest.fn(echo) };
  const workoutRepo = { find: jest.fn() };
  const base = {
    weekNumber: 1,
    difficulty: Difficulty.BEGINNER,
    locationType: LocationType.GYM,
    title: 'Week 1',
  };
  let service: ProgrammesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProgrammesService(
      programmeRepo as never,
      dayRepo as never,
      workoutRepo as never,
    );
  });

  it('checks ownership of every workout with one query and keeps rest days', async () => {
    workoutRepo.find.mockResolvedValue([{ id: 'w1' }, { id: 'w2' }]);

    const saved = await service.createProgramme(user, {
      ...base,
      days: [
        { dayNumber: 1, workoutId: 'w1' },
        { dayNumber: 2 },
        { dayNumber: 3, workoutId: 'w2' },
        { dayNumber: 4, workoutId: 'w1' },
      ],
    });

    expect(workoutRepo.find).toHaveBeenCalledTimes(1);
    expect(workoutRepo.find.mock.calls[0][0].where.user).toEqual({
      id: 'user-1',
    });
    expect(saved).toMatchObject({
      days: [
        { dayNumber: 1, workout: { id: 'w1' } },
        { dayNumber: 2, workout: null },
        { dayNumber: 3, workout: { id: 'w2' } },
        { dayNumber: 4, workout: { id: 'w1' } },
      ],
    });
  });

  it("refuses a workout that is not the caller's", async () => {
    workoutRepo.find.mockResolvedValue([]);

    await expect(
      service.createProgramme(user, {
        ...base,
        days: [{ dayNumber: 1, workoutId: 'someone-elses' }],
      }),
    ).rejects.toThrow(new NotFoundException('Workout someone-elses not found'));
    expect(programmeRepo.save).not.toHaveBeenCalled();
  });

  it('does not query the database when every day is a rest day', async () => {
    await service.createProgramme(user, {
      ...base,
      days: [{ dayNumber: 1 }, { dayNumber: 2 }],
    });
    expect(workoutRepo.find).not.toHaveBeenCalled();
  });
});
