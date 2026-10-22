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
  let photos: { removeAll: jest.Mock };
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
    photos = { removeAll: jest.fn() };
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
      photos as never,
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

  it('on delete, rebuilds the stats of the exercises it contained and deletes its photos', async () => {
    manager.findOne.mockResolvedValue({
      id: 'w-1',
      photoUrl: '/uploads/workouts/photo.webp',
      photoThumbnailUrl: '/uploads/workouts/thumb.webp',
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
    expect(photos.removeAll).toHaveBeenCalledWith([
      '/uploads/workouts/photo.webp',
      '/uploads/workouts/thumb.webp',
    ]);
  });
});

describe('WorkoutService completed workout photo', () => {
  const user = { id: 'user-1', email: 'u@example.com' };
  const file = { buffer: Buffer.from('jpeg') } as Express.Multer.File;
  const old = {
    photoUrl: '/uploads/workouts/old.webp',
    photoThumbnailUrl: '/uploads/workouts/old-thumb.webp',
  };
  const fresh = {
    photoUrl: '/uploads/workouts/new.webp',
    photoThumbnailUrl: '/uploads/workouts/new-thumb.webp',
  };
  const query = { setLock: jest.fn(), where: jest.fn(), getOne: jest.fn() };
  const manager = {
    createQueryBuilder: jest.fn(() => query),
    update: jest.fn(),
  };
  const completedRepo = { exists: jest.fn() };
  const photos = { uploadWithThumbnail: jest.fn(), removeAll: jest.fn() };
  let service: WorkoutService;

  beforeEach(() => {
    jest.clearAllMocks();
    query.setLock.mockReturnValue(query);
    query.where.mockReturnValue(query);
    query.getOne.mockResolvedValue({ id: 'w-1', ...old });
    completedRepo.exists.mockResolvedValue(true);
    photos.uploadWithThumbnail.mockResolvedValue({ ...fresh });
    service = new WorkoutService(
      {} as never,
      {} as never,
      completedRepo as never,
      {} as never,
      {
        transaction: (run: (m: typeof manager) => unknown) => run(manager),
      } as never,
      {} as never,
      {} as never,
      photos as never,
    );
  });

  it("refuses someone else's workout before doing any image work", async () => {
    completedRepo.exists.mockResolvedValue(false);

    await expect(
      service.setCompletedWorkoutPhoto(user, 'w-1', file),
    ).rejects.toThrow('Completed workout not found');
    expect(completedRepo.exists).toHaveBeenCalledWith({
      where: { id: 'w-1', user: { id: 'user-1' } },
    });
    expect(photos.uploadWithThumbnail).not.toHaveBeenCalled();
  });

  it('stores the new photo and thumbnail under a row lock, then deletes the old files', async () => {
    await expect(
      service.setCompletedWorkoutPhoto(user, 'w-1', file),
    ).resolves.toEqual(fresh);
    expect(photos.uploadWithThumbnail).toHaveBeenCalledWith(file);
    expect(query.setLock).toHaveBeenCalledWith('pessimistic_write');
    expect(query.where).toHaveBeenCalledWith(expect.any(String), {
      workoutId: 'w-1',
      userId: 'user-1',
    });
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      'w-1',
      fresh,
    );
    expect(photos.removeAll).toHaveBeenCalledTimes(1);
    expect(photos.removeAll).toHaveBeenCalledWith([
      old.photoUrl,
      old.photoThumbnailUrl,
    ]);
  });

  it('deletes the new files when the workout disappeared during the upload', async () => {
    query.getOne.mockResolvedValue(null);

    await expect(
      service.setCompletedWorkoutPhoto(user, 'w-1', file),
    ).rejects.toThrow('Completed workout not found');
    expect(manager.update).not.toHaveBeenCalled();
    expect(photos.removeAll).toHaveBeenCalledTimes(1);
    expect(photos.removeAll).toHaveBeenCalledWith([
      fresh.photoUrl,
      fresh.photoThumbnailUrl,
    ]);
  });

  it('removes the photo and thumbnail from the workout, then their files', async () => {
    const none = { photoUrl: null, photoThumbnailUrl: null };

    await expect(
      service.removeCompletedWorkoutPhoto(user, 'w-1'),
    ).resolves.toEqual(none);
    expect(manager.update).toHaveBeenCalledWith(expect.anything(), 'w-1', none);
    expect(photos.removeAll).toHaveBeenCalledWith([
      old.photoUrl,
      old.photoThumbnailUrl,
    ]);
  });
});
