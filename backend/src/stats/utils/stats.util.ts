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
