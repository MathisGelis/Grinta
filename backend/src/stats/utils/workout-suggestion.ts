import { DetailedMuscleGroup } from '../../exercise/enums/detailed-muscle.enum';

/** What one planned workout works, in effective sets per muscle. */
export interface PlannedTargets {
  id: string;
  targets: Map<DetailedMuscleGroup, number>;
}

export interface RankedWorkout {
  id: string;
  /**
   * From 0 to 1: how little the muscles the workout works were trained over
   * the period, weighted by how much it works each. 1 means none of them was.
   */
  score: number;
  /** Its muscles, the least trained over the period first. */
  muscles: Array<{
    muscle: DetailedMuscleGroup;
    plannedSets: number;
    workedSets: number;
  }>;
}

const round = (value: number, decimals = 2) =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

/**
 * Ranks planned workouts by how much they work the muscles left aside over
 * the period. Each muscle a workout works counts for its planned effective
 * sets, times 1 / (1 + the effective sets it already got): a muscle not
 * trained at all weighs fully, one trained a lot barely. Ties go to the
 * workout with more sets, then to the id, so the order is stable. Workouts
 * that work nothing are left out.
 */
export function rankByNeglectedMuscles(
  worked: Map<DetailedMuscleGroup, number>,
  workouts: PlannedTargets[],
): RankedWorkout[] {
  return workouts
    .map(({ id, targets }) => {
      let total = 0;
      let fresh = 0;

      for (const [muscle, sets] of targets) {
        total += sets;
        fresh += sets / (1 + (worked.get(muscle) ?? 0));
      }
      return {
        id,
        total,
        score: total ? round(fresh / total, 3) : 0,
        muscles: [...targets.entries()]
          .map(([muscle, plannedSets]) => ({
            muscle,
            plannedSets: round(plannedSets),
            workedSets: round(worked.get(muscle) ?? 0),
          }))
          .sort(
            (a, b) =>
              a.workedSets - b.workedSets || b.plannedSets - a.plannedSets,
          ),
      };
    })
    .filter((w) => w.total > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.total - a.total || a.id.localeCompare(b.id),
    )
    .map(({ id, score, muscles }) => ({ id, score, muscles }));
}
