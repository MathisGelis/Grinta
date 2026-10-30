import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Programme } from './entities/programme.entity';
import { ProgrammeDay } from './entities/programme-day.entity';
import { PlannedWorkout } from 'src/workouts/entities/planned-workout.entity';
import { AuthUser } from 'src/auth/auth-user.interface';
import {
  CreateProgrammeDto,
  ProgrammeDayDto,
} from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { omitUndefined } from 'src/common/utils/omit-undefined';
import { programmePositionOn, todayUtc } from './utils/programme-day';

@Injectable()
export class ProgrammesService {
  constructor(
    @InjectRepository(Programme)
    private programmeRepo: Repository<Programme>,

    @InjectRepository(ProgrammeDay)
    private dayRepo: Repository<ProgrammeDay>,

    @InjectRepository(PlannedWorkout)
    private workoutRepo: Repository<PlannedWorkout>,
  ) {}

  async createProgramme(
    user: AuthUser,
    dto: CreateProgrammeDto,
  ): Promise<Programme> {
    const programme = this.programmeRepo.create({
      user: { id: user.id },
      weekNumber: dto.weekNumber,
      difficulty: dto.difficulty,
      locationType: dto.locationType,
      title: dto.title,
      description: dto.description,
    });

    programme.days = await this.buildDays(user, dto.days);
    return this.programmeRepo.save(programme);
  }

  async updateProgramme(
    user: AuthUser,
    id: string,
    dto: UpdateProgrammeDto,
  ): Promise<Programme> {
    const programme = await this.programmeRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['days', 'days.workout'],
    });
    if (!programme) throw new NotFoundException('Programme not found');

    // Only scalar fields are merged. Spreading the whole dto would also put
    // the raw `days` payload on the entity before it is rebuilt below.
    const { days, ...scalarFields } = dto;

    Object.assign(programme, omitUndefined(scalarFields));
    if (days) {
      await this.dayRepo.delete({ programme: { id: programme.id } });
      programme.days = await this.buildDays(user, days);
    }
    return this.programmeRepo.save(programme);
  }

  // Counted in SQL: loading every day and its planned workout only to count
  // them read about 1 KB per programme from the database for a few bytes of
  // response.
  async getProgrammesByUser(user: AuthUser): Promise<
    Array<{
      id: string;
      title: string;
      totalDays: number;
      workoutDays: number;
      difficulty: string;
    }>
  > {
    return this.programmeRepo
      .createQueryBuilder('p')
      .leftJoin('p.days', 'd')
      .select([
        'p.id AS id',
        'p.title AS title',
        'COUNT(d.id)::int AS "totalDays"',
        'COUNT(d."workoutId")::int AS "workoutDays"',
        'p.difficulty AS difficulty',
      ])
      .where('p."userId" = :userId', { userId: user.id })
      .groupBy('p.id')
      .orderBy('p."weekNumber"', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .getRawMany();
  }

  async getProgrammeById(user: AuthUser, id: string) {
    const programme = await this.programmeRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['days', 'days.workout'],
    });

    if (!programme) throw new NotFoundException('Programme not found');

    const days = [...programme.days].sort((a, b) => a.dayNumber - b.dayNumber);
    const workoutDays = days.filter((d) => d.workout !== null);

    return {
      id: programme.id,
      weekNumber: programme.weekNumber,
      difficulty: programme.difficulty,
      locationType: programme.locationType,
      title: programme.title,
      description: programme.description,
      totalWorkoutDays: workoutDays.length,
      days: days.map((day) => ({
        dayNumber: day.dayNumber,
        workout: day.workout
          ? {
              id: day.workout.id,
              title: day.workout.title,
              description: day.workout.description,
            }
          : null,
      })),
    };
  }

  /**
   * Starts following one of the user's programmes, from `startDate` (day 1),
   * today by default. It replaces the programme followed until now, if any.
   * Returns what the start date holds, as GET /programmes/active/today.
   */
  async startProgramme(
    user: AuthUser,
    programmeId: string,
    startDate?: string,
  ) {
    const owned = await this.programmeRepo.exists({
      where: { id: programmeId, user: { id: user.id } },
    });

    if (!owned) throw new NotFoundException('Programme not found');
    const startedOn = startDate ?? todayUtc();

    await this.programmeRepo.manager.query(
      `INSERT INTO active_programmes ("userId", "programmeId", "startedOn")
       VALUES ($1, $2, $3)
       ON CONFLICT ("userId") DO UPDATE
         SET "programmeId" = EXCLUDED."programmeId",
             "startedOn" = EXCLUDED."startedOn",
             "createdAt" = now()`,
      [user.id, programmeId, startedOn],
    );
    return this.todaysWorkout(user, startedOn);
  }

  /**
   * The workout the followed programme plans for a date, today by default.
   * The day is counted in calendar days from the start, whether or not the
   * user trained, and the programme starts over after its last day; a day
   * missing from the programme is a rest day. `status` is `workout`, `rest`,
   * or `not_started` for a date before the start.
   */
  async todaysWorkout(user: AuthUser, date = todayUtc()) {
    // to_char: the pg driver would turn a DATE into a Date at local midnight.
    const [active] = await this.programmeRepo.manager.query<
      Array<{ programmeId: string; startedOn: string }>
    >(
      `SELECT "programmeId", to_char("startedOn", 'YYYY-MM-DD') AS "startedOn"
         FROM active_programmes WHERE "userId" = $1`,
      [user.id],
    );

    if (!active) throw new NotFoundException('Aucun programme en cours.');
    const programme = await this.programmeRepo.findOneOrFail({
      where: { id: active.programmeId },
      relations: ['days', 'days.workout', 'days.workout.exercises'],
    });
    // A programme edited down to no day at all is all rest.
    const cycleLength = Math.max(1, ...programme.days.map((d) => d.dayNumber));
    const position = programmePositionOn(active.startedOn, date, cycleLength);
    const base = {
      programme: { id: programme.id, title: programme.title },
      startedOn: active.startedOn,
      date,
      cycleLength,
    };

    if (position.status === 'not_started')
      return {
        ...base,
        status: 'not_started' as const,
        daysUntilStart: position.daysUntilStart,
        dayNumber: null,
        cycle: null,
        workout: null,
      };
    const workout =
      programme.days.find((d) => d.dayNumber === position.dayNumber)?.workout ??
      null;

    return {
      ...base,
      status: workout ? ('workout' as const) : ('rest' as const),
      dayNumber: position.dayNumber,
      cycle: position.cycle,
      workout,
    };
  }

  async deleteProgramme(
    user: AuthUser,
    id: string,
  ): Promise<{ message: string }> {
    const programme = await this.programmeRepo.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!programme) throw new NotFoundException('Programme not found');
    await this.programmeRepo.remove(programme);
    return { message: 'Programme deleted successfully' };
  }

  /**
   * Builds the days of a programme, checking in one query that every referenced
   * workout belongs to the caller. A day without workoutId is a rest day.
   */
  private async buildDays(
    user: AuthUser,
    dayDtos: ProgrammeDayDto[],
  ): Promise<ProgrammeDay[]> {
    const workoutIds = [
      ...new Set(dayDtos.map((d) => d.workoutId).filter(Boolean)),
    ] as string[];
    const owned = workoutIds.length
      ? await this.workoutRepo.find({
          where: { id: In(workoutIds), user: { id: user.id } },
        })
      : [];
    const byId = new Map(owned.map((w) => [w.id, w]));

    return dayDtos.map((dayDto) => {
      let workout: PlannedWorkout | null = null;

      if (dayDto.workoutId) {
        workout = byId.get(dayDto.workoutId) ?? null;
        if (!workout)
          throw new NotFoundException(`Workout ${dayDto.workoutId} not found`);
      }
      return this.dayRepo.create({ dayNumber: dayDto.dayNumber, workout });
    });
  }
}
