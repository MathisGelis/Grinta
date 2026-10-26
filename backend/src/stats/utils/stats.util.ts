import { StatsPeriod } from '../dto/period-query.dto';

export interface DateRange {
  start: Date;
  end: Date;
}

export function round(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;

  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function sum<T>(
  items: T[] | undefined,
  pick: (item: T) => number,
): number {
  return (items ?? []).reduce((acc, it) => acc + (pick(it) || 0), 0);
}

export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;

  return weight * (1 + reps / 30);
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return round(((current - previous) / previous) * 100, 1);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);

  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);

  d.setDate(d.getDate() + days);
  return d;
}

export function dayKey(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;

  d.setDate(d.getDate() + diff);
  return d;
}

export function dayRange(date: Date): DateRange {
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function resolvePeriodRange(
  period: StatsPeriod,
  date?: string,
): DateRange {
  const ref = date ? new Date(date) : new Date();

  if (period === StatsPeriod.WEEK) {
    const start = startOfWeek(ref);
    return { start, end: endOfDay(addDays(start, 6)) };
  }
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    ref.getFullYear(),
    ref.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return { start, end };
}

export function previousPeriodRange(
  period: StatsPeriod,
  date?: string,
): DateRange {
  const ref = date ? new Date(date) : new Date();

  if (period === StatsPeriod.WEEK) {
    const prevRef = addDays(startOfWeek(ref), -7);
    return resolvePeriodRange(period, prevRef.toISOString());
  }
  const prevRef = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);

  return resolvePeriodRange(period, prevRef.toISOString());
}

/**
 * The `count` full periods that precede the one containing `date`, most recent
 * first. Used to build a personal baseline.
 */
export function precedingPeriodRanges(
  period: StatsPeriod,
  date: string | undefined,
  count: number,
): DateRange[] {
  const ranges: DateRange[] = [];
  let ref = date ? new Date(date) : new Date();

  for (let i = 0; i < count; i++) {
    const previous = previousPeriodRange(period, ref.toISOString());

    ranges.push(previous);
    ref = previous.start;
  }
  return ranges;
}

/** Share of `range` already elapsed at `now`, clamped to the 0 to 1 interval. */
export function elapsedFraction(range: DateRange, now: Date): number {
  const total = +range.end - +range.start;

  if (total <= 0) return 1;
  return Math.min(Math.max((+now - +range.start) / total, 0), 1);
}

const MS_PER_DAY = 86_400_000;

/** Days since the epoch for a 'YYYY-MM-DD' key, independent of time zone. */
export function dayNumber(key: string): number {
  return Math.round(Date.parse(`${key}T00:00:00Z`) / MS_PER_DAY);
}

/** Longest run of consecutive calendar days in a list of 'YYYY-MM-DD' keys. */
export function longestStreak(dayKeys: string[]): number {
  const days = [...new Set(dayKeys.map(dayNumber))].sort((a, b) => a - b);
  let longest = days.length ? 1 : 0;
  let run = days.length ? 1 : 0;

  for (let i = 1; i < days.length; i++) {
    run = days[i] - days[i - 1] === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}
