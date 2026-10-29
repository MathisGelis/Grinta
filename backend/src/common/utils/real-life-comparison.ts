/**
 * A lifted weight told as everyday objects: "6 t, that is 4 cars". `object`
 * is an English key the app translates; `count` has one decimal.
 */
export interface RealLifeComparison {
  object: RealLifeObject;
  count: number;
}

// Typical weights, rounded: the comparison is meant to be fun, not exact.
// Ordered from the lightest; each one at least about twice the previous, so
// every load from a single lift to a whole session finds a fitting object.
const OBJECTS = [
  { object: 'bowling_ball', kg: 7 }, // 16 lb, the heaviest allowed
  { object: 'golden_retriever', kg: 30 },
  { object: 'washing_machine', kg: 70 },
  { object: 'giant_panda', kg: 100 },
  { object: 'upright_piano', kg: 230 },
  { object: 'horse', kg: 500 },
  { object: 'car', kg: 1_500 },
  { object: 'white_rhinoceros', kg: 2_300 },
  { object: 'african_elephant', kg: 6_000 },
  { object: 'school_bus', kg: 11_000 },
  { object: 'boeing_737', kg: 41_000 }, // empty
  { object: 'statue_of_liberty', kg: 225_000 },
] as const;

export type RealLifeObject = (typeof OBJECTS)[number]['object'];

export const REAL_LIFE_OBJECTS: readonly RealLifeObject[] = OBJECTS.map(
  (o) => o.object,
);

/**
 * The heaviest object that the load reaches at least once, so the count is
 * never below 1. Null for a load lighter than the lightest object, or not a
 * positive number.
 */
export function compareToRealLife(kg: number): RealLifeComparison | null {
  if (!Number.isFinite(kg) || kg <= 0) return null;
  let match: (typeof OBJECTS)[number] | undefined;

  for (const candidate of OBJECTS) if (candidate.kg <= kg) match = candidate;
  if (!match) return null;
  return {
    object: match.object,
    count: Math.floor((kg / match.kg) * 10) / 10,
  };
}
