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
