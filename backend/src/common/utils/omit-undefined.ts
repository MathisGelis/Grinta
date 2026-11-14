/**
 * Drops keys whose value is undefined so that a partial update only touches
 * the fields the client actually sent.
 */
export function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
