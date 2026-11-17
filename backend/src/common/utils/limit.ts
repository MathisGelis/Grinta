const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Turns a raw `limit` query value into a safe positive integer. Missing, NaN,
 * zero or negative values fall back to the default, and anything above the cap
 * is clamped, so a client can neither crash Postgres with a negative LIMIT nor
 * ask for the whole table in one request.
 */
export function clampLimit(
  raw: unknown,
  fallback = DEFAULT_LIMIT,
  max = MAX_LIMIT,
): number {
  const value = Math.floor(Number(raw));

  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(value, max);
}
