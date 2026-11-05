import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuthUser } from '../auth/auth-user.interface';
import { Exercise } from '../exercise/entities/exercise.entity';
import { Programme } from '../programmes/entities/programme.entity';
import { ProgrammeDay } from '../programmes/entities/programme-day.entity';
import { Difficulty } from '../programmes/enums/difficulty.enum';
import { LocationType } from '../programmes/enums/location-type.enum';
import { User } from '../users/entities/users.entity';
import { TrainingLevel } from '../users/enums/level.enum';
import { TrainingLocation } from '../users/enums/training-location.enum';
import {
  PlannedWorkout,
  PlannedWorkoutExercise,
} from '../workouts/entities/planned-workout.entity';
import { TemplatesQueryDto } from './dto/templates-query.dto';
import {
  rankTemplates,
  TemplateCriteria,
  TemplateMove,
  TemplateWorkout,
  WORKOUT_TEMPLATES,
  WorkoutTemplate,
} from './template-catalogue';

const DIFFICULTY: Record<TrainingLevel, Difficulty> = {
  [TrainingLevel.BEGINNER]: Difficulty.BEGINNER,
  [TrainingLevel.INTERMEDIATE]: Difficulty.INTERMEDIATE,
  [TrainingLevel.ADVANCED]: Difficulty.ADVANCED,
};

const LOCATION: Record<TrainingLocation, LocationType> = {
  [TrainingLocation.GYM]: LocationType.GYM,
  [TrainingLocation.HOME]: LocationType.HOME,
};

/** The planned sets of a move: bodyweight or a load the user fills in. */
const setsOf = (move: TemplateMove) =>
  Array.from({ length: move.sets }, () => ({ reps: move.reps, weight: 0 }));

/** Timed moves have no duration field: they are spelled out in French. */
function durationHints(workout: TemplateWorkout): string | null {
  const lines = workout.moves
    .filter((move) => move.durationSeconds)
    .map((move) => {
      const s = move.durationSeconds!;
      const time = s >= 60 && s % 60 === 0 ? `${s / 60} min` : `${s} s`;

      return `${move.exercise} : ${move.sets > 1 ? `${move.sets} × ` : ''}${time}`;
    });

  return lines.length ? lines.join('\n') : null;
}

@Injectable()
export class WorkoutTemplatesService {
  private exerciseIds?: Map<string, string>;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Every template, the best fit for the onboarding answers first. */
  async listTemplates(user: AuthUser, query: TemplatesQueryDto) {
    const criteria = await this.criteriaFor(user, query);
    const ids = await this.resolveExerciseIds();

    return {
      criteria,
      templates: rankTemplates(criteria).map(({ template, recommended }) => ({
        ...this.toDto(template, ids),
        recommended,
      })),
    };
  }

  /**
   * Copies a template into the caller's account: one planned workout per
   * session, and a programme laying them out over the week. The programme
   * is not started; the app starts it with POST /programmes/:id/start.
   */
  async useTemplate(user: AuthUser, key: string) {
    const template = WORKOUT_TEMPLATES.find((t) => t.key === key);

    if (!template) throw new NotFoundException('Modèle introuvable');
    const ids = await this.resolveExerciseIds();
    const profile = await this.userRepo.findOne({
      where: { id: user.id },
      select: ['id', 'level'],
    });
    const level =
      profile?.level && template.levels.includes(profile.level)
        ? profile.level
        : template.levels[0];

    const programmeId = await this.dataSource.transaction(async (manager) => {
      const workoutIds = new Map<string, string>();

      for (const workout of template.workouts) {
        const saved = await manager.save(
          manager.create(PlannedWorkout, {
            user: { id: user.id },
            title: workout.title,
            description: durationHints(workout) ?? undefined,
            estimatedDurationMinutes: workout.estimatedDurationMinutes,
          }),
        );
        const moves = workout.moves.filter((move) => ids.has(move.exercise));

        if (moves.length)
          await manager.insert(
            PlannedWorkoutExercise,
            moves.map((move, position) => ({
              workout: { id: saved.id },
              position,
              exercise: { id: ids.get(move.exercise) },
              sets: setsOf(move),
              plannedRestSeconds: move.restSeconds,
            })),
          );
        workoutIds.set(workout.key, saved.id);
      }
      const programme = manager.create(Programme, {
        user: { id: user.id },
        weekNumber: 1,
        difficulty: DIFFICULTY[level],
        locationType: LOCATION[template.location],
        title: template.title,
        description: template.description,
      });

      programme.days = template.week.map((workoutKey, i) =>
        manager.create(ProgrammeDay, {
          dayNumber: i + 1,
          workout: workoutKey ? { id: workoutIds.get(workoutKey) } : null,
        }),
      );
      return (await manager.save(programme)).id;
    });

    const programme = await this.dataSource
      .getRepository(Programme)
      .findOneOrFail({
        where: { id: programmeId },
        relations: ['days', 'days.workout'],
        order: { days: { dayNumber: 'ASC' } },
      });
    // Loaded apart, like GET /workouts/planned/:id, so that each workout
    // comes once with its exercises.
    const workouts = await this.dataSource.getRepository(PlannedWorkout).find({
      where: {
        id: In(
          programme.days.flatMap((d) => (d.workout ? [d.workout.id] : [])),
        ),
      },
      relations: ['exercises'],
    });
    const byId = new Map(workouts.map((w) => [w.id, w]));

    for (const day of programme.days)
      day.workout = day.workout ? (byId.get(day.workout.id) ?? null) : null;
    return programme;
  }

  private async criteriaFor(
    user: AuthUser,
    query: TemplatesQueryDto,
  ): Promise<TemplateCriteria> {
    const profile = await this.userRepo.findOne({
      where: { id: user.id },
      select: [
        'id',
        'goal',
        'level',
        'trainingDaysPerWeek',
        'trainingLocation',
      ],
    });

    return {
      goal: query.goal ?? profile?.goal ?? null,
      level: query.level ?? profile?.level ?? null,
      daysPerWeek: query.daysPerWeek ?? profile?.trainingDaysPerWeek ?? null,
      location: query.location ?? profile?.trainingLocation ?? null,
    };
  }

  private toDto(template: WorkoutTemplate, ids: Map<string, string>) {
    return {
      key: template.key,
      title: template.title,
      description: template.description,
      goals: template.goals,
      levels: template.levels,
      daysPerWeek: template.daysPerWeek,
      location: template.location,
      workouts: template.workouts.map((workout) => ({
        key: workout.key,
        title: workout.title,
        estimatedDurationMinutes: workout.estimatedDurationMinutes,
        exercises: workout.moves
          .filter((move) => ids.has(move.exercise))
          .map((move) => ({
            exerciseId: ids.get(move.exercise)!,
            name: move.exercise,
            sets: setsOf(move),
            plannedRestSeconds: move.restSeconds,
            durationSeconds: move.durationSeconds ?? null,
          })),
      })),
      week: template.week.map((workoutKey, i) => ({
        dayNumber: i + 1,
        workoutKey,
      })),
    };
  }

  /**
   * Catalogue ids of the template exercises, read once: the catalogue only
   * changes with a deployment. Not cached while the catalogue is empty.
   */
  private async resolveExerciseIds(): Promise<Map<string, string>> {
    if (this.exerciseIds) return this.exerciseIds;

    const names = [
      ...new Set(
        WORKOUT_TEMPLATES.flatMap((t) =>
          t.workouts.flatMap((w) => w.moves.map((move) => move.exercise)),
        ),
      ),
    ];
    const rows = await this.exerciseRepo.find({
      where: { name: In(names) },
      select: ['id', 'name'],
    });
    const ids = new Map(rows.map((row) => [row.name, row.id]));

    if (ids.size === names.length) this.exerciseIds = ids;
    return ids;
  }
}
