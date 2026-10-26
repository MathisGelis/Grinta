import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  ExerciseHistory,
  ExerciseRecords,
} from '../exercise/exercise-stats.service';
import { percentChange, round } from '../stats/utils/stats.util';
import { BadgeDto } from './dto/badge.dto';
import { ListBadgesQueryDto } from './dto/list-badges-query.dto';
import { Badge } from './entities/badge.entity';
import { BADGE_UNIT } from './enums/badge-type.enum';
import { detectPersonalRecords } from './utils/personal-records.util';

const DEFAULT_LIMIT = 50;

@Injectable()
export class BadgesService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  /**
   * (Re)computes the badges earned by one workout, from the history of the
   * exercises it contains, and returns them. Badges already attached to the
   * workout are replaced, so an edit that lowers a weight also removes the
   * record it no longer holds. Badges of other workouts are left alone: a
   * badge records that the workout beat every other one when it was saved.
   */
  async awardForWorkout(
    manager: EntityManager,
    userId: string,
    workout: { id: string; completionDate: Date },
    histories: Map<string, ExerciseHistory>,
    { replaceExisting }: { replaceExisting: boolean },
  ): Promise<BadgeDto[]> {
    if (replaceExisting)
      await manager.delete(Badge, { workout: { id: workout.id } });
    return this.awardRecords(
      manager,
      userId,
      workout,
      [...histories.values()].map((history) => ({
        exerciseId: history.exerciseId,
        exerciseName: history.exerciseName,
        records: detectPersonalRecords(history.sessions, workout.id),
      })),
    );
  }

  /** Saves the badges of records already detected for a workout. */
  async awardRecords(
    manager: EntityManager,
    userId: string,
    workout: { id: string; completionDate: Date },
    exercises: ExerciseRecords[],
  ): Promise<BadgeDto[]> {
    const badges: Badge[] = [];

    for (const exercise of exercises)
      for (const record of exercise.records)
        badges.push(
          manager.create(Badge, {
            user: { id: userId },
            exercise: { id: exercise.exerciseId, name: exercise.exerciseName },
            workout: { id: workout.id },
            type: record.type,
            value: record.value,
            previousValue: record.previousValue,
            weight: record.weight,
            reps: record.reps,
            achievedAt: workout.completionDate,
          }),
        );
    if (!badges.length) return [];
    await manager.insert(Badge, badges);
    return badges.map((badge) => toDto(badge, workout.id));
  }

  async listForUser(
    userId: string,
    query: ListBadgesQueryDto,
  ): Promise<BadgeDto[]> {
    const qb = this.badgeRepository
      .createQueryBuilder('badge')
      .innerJoinAndSelect('badge.exercise', 'exercise')
      .where('badge."userId" = :userId', { userId })
      .orderBy('badge."achievedAt"', 'DESC')
      .addOrderBy('badge."createdAt"', 'DESC')
      .addOrderBy('badge.id', 'DESC')
      .limit(query.limit ?? DEFAULT_LIMIT);

    if (query.exerciseId)
      qb.andWhere('badge."exerciseId" = :exerciseId', {
        exerciseId: query.exerciseId,
      });
    if (query.type) qb.andWhere('badge.type = :type', { type: query.type });
    const badges = await qb.getMany();

    return badges.map((badge) => toDto(badge, badge.workoutId));
  }
}

function toDto(badge: Badge, workoutId: string): BadgeDto {
  return {
    id: badge.id,
    type: badge.type,
    exercise: { id: badge.exercise.id, name: badge.exercise.name },
    workoutId,
    unit: BADGE_UNIT[badge.type],
    value: badge.value,
    previousValue: badge.previousValue,
    improvement: round(badge.value - badge.previousValue),
    improvementPct: percentChange(badge.value, badge.previousValue),
    weight: badge.weight,
    reps: badge.reps,
    achievedAt: badge.achievedAt,
  };
}
