const DAY_MS = 86_400_000;

/** Where a started programme stands on a given date. */
export type ProgrammePosition =
  | { status: 'not_started'; daysUntilStart: number }
  | { status: 'running'; dayNumber: number; cycle: number };

/** Days from one calendar date (YYYY-MM-DD) to another, time zones aside. */
export function daysBetween(from: string, to: string): number {
  const utc = (date: string) => {
    const [y, m, d] = date.split('-').map(Number);

    return Date.UTC(y, m - 1, d);
  };

  return Math.round((utc(to) - utc(from)) / DAY_MS);
}

/**
 * The day of the programme for a date, counting calendar days from the start:
 * the start date is day `startDay` (1 by default), the next date the day
 * after, whether or not the user trained. After the last day the programme
 * starts over, and `cycle` counts the rounds (1 for the first one, even when
 * it began on a later day).
 */
export function programmePositionOn(
  startedOn: string,
  date: string,
  cycleLength: number,
  startDay = 1,
): ProgrammePosition {
  const elapsed = daysBetween(startedOn, date);

  if (elapsed < 0) return { status: 'not_started', daysUntilStart: -elapsed };
  const fromDayOne = elapsed + startDay - 1;

  return {
    status: 'running',
    dayNumber: (fromDayOne % cycleLength) + 1,
    cycle: Math.floor(fromDayOne / cycleLength) + 1,
  };
}

/** Today's date in UTC, the default when the app sends none. */
export function todayUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
