import type { ExerciseDetailsTranslation } from './exercise-translations';

export interface ExerciseLookup {
  /** English name of a catalogue exercise, by id. */
  englishName(id: string): string | undefined;
  name(englishName: string): string | undefined;
  details(englishName: string): ExerciseDetailsTranslation | undefined;
}

const MAX_DEPTH = 16;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** A copy that keeps the class, so class-transformer still applies. */
const cloneWith = (
  source: Record<string, unknown>,
  changes: Record<string, unknown>,
) =>
  Object.assign(
    Object.create(Object.getPrototypeOf(source) as object) as object,
    source,
    changes,
  ) as Record<string, unknown>;

/**
 * Translates the catalogue exercises found anywhere in a response:
 * - an exercise `{ id, name, description?, instructions? }` (lists, workouts);
 * - a summary `{ exerciseId, name }` (posts, records, templates, imports);
 * - a summary `{ exerciseId, exerciseName }` (exercise stats, badges).
 * The id must be a catalogue exercise and the name its English name, so a
 * group or a user called "Plank" is left alone. The response is not changed
 * in place: changed objects are copied, so cached values stay English.
 * Translated exercises keep their English name in `englishName`.
 */
export function localizeResponse(
  value: unknown,
  lookup: ExerciseLookup,
  depth = 0,
): unknown {
  if (
    depth > MAX_DEPTH ||
    !isObject(value) ||
    value instanceof Date ||
    Buffer.isBuffer(value) ||
    typeof value.pipe === 'function' ||
    typeof value.getStream === 'function'
  )
    return value;
  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((item) => {
      const next = localizeResponse(item, lookup, depth + 1);

      changed ||= next !== item;
      return next;
    });

    return changed ? items : value;
  }
  const changes: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    const next = localizeResponse(child, lookup, depth + 1);

    if (next !== child) changes[key] = next;
  }
  Object.assign(changes, ownChanges(value, lookup));
  return Object.keys(changes).length ? cloneWith(value, changes) : value;
}

function ownChanges(
  value: Record<string, unknown>,
  lookup: ExerciseLookup,
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};
  const byId =
    typeof value.id === 'string' ? lookup.englishName(value.id) : undefined;
  const bySummary =
    typeof value.exerciseId === 'string'
      ? lookup.englishName(value.exerciseId)
      : undefined;

  if (byId && value.name === byId) {
    const name = lookup.name(byId);
    const details = lookup.details(byId);

    if (name) Object.assign(changes, { name, englishName: byId });
    if (details?.description && typeof value.description === 'string')
      changes.description = details.description;
    if (details?.instructions?.length && Array.isArray(value.instructions))
      changes.instructions = details.instructions;
  }
  if (bySummary) {
    const name = lookup.name(bySummary);

    if (name && value.name === bySummary) changes.name = name;
    if (name && value.exerciseName === bySummary) changes.exerciseName = name;
  }
  return changes;
}
