import { CATALOGUE_TTL_MS, ExerciseService } from './exercise.service';

describe('ExerciseService catalogue cache', () => {
  const rows = [
    { id: 'a', equipment_type: 'barbell', primary_muscle: 'middle_chest' },
    { id: 'b', equipment_type: 'dumbbell', primary_muscle: 'triceps' },
    { id: 'c', equipment_type: 'barbell', primary_muscle: 'quads' },
  ];
  const getMany = jest.fn();
  const query = {
    select: () => query,
    orderBy: () => query,
    addOrderBy: () => query,
    getMany,
  };
  const repository = {
    createQueryBuilder: jest.fn(() => query),
    create: jest.fn((dto: object) => dto),
    save: jest.fn((e: object) => Promise.resolve(e)),
  };
  let service: ExerciseService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    getMany.mockResolvedValue(rows);
    service = new ExerciseService(repository as never);
  });

  it('reads the catalogue from the database once', async () => {
    await service.findAll({});
    await service.findAll({});

    expect(await service.findAll({})).toEqual(rows);
    expect(getMany).toHaveBeenCalledTimes(1);
  });

  it('filters the cached list by equipment and muscles', async () => {
    expect(
      (await service.findAll({ equipmentType: 'barbell' as never })).map(
        (e) => e.id,
      ),
    ).toEqual(['a', 'c']);
    expect(
      (await service.findAll({ primaryMuscles: 'triceps, quads' })).map(
        (e) => e.id,
      ),
    ).toEqual(['b', 'c']);
    expect(getMany).toHaveBeenCalledTimes(1);
  });

  it('reloads after a write', async () => {
    await service.findAll({});
    await service.create({ name: 'New' } as never);
    await service.findAll({});

    expect(getMany).toHaveBeenCalledTimes(2);
  });

  it('reloads once the TTL has passed', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    await service.findAll({});
    now.mockReturnValue(1_000_000 + CATALOGUE_TTL_MS + 1);
    await service.findAll({});

    expect(getMany).toHaveBeenCalledTimes(2);
  });

  it('does not keep a list that was being read while a write happened', async () => {
    let finishRead: (value: unknown) => void = () => undefined;

    getMany.mockReturnValueOnce(
      new Promise((resolve) => (finishRead = resolve)),
    );
    const staleRead = service.findAll({});

    await service.create({ name: 'New' } as never);
    finishRead(rows);
    await staleRead;
    await service.findAll({});

    expect(getMany).toHaveBeenCalledTimes(2);
  });
});
