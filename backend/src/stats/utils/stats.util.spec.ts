import { StatsPeriod } from '../dto/period-query.dto';
import {
  dayNumber,
  elapsedFraction,
  longestStreak,
  precedingPeriodRanges,
} from './stats.util';

describe('longestStreak', () => {
  it('is 0 without days', () => {
    expect(longestStreak([])).toBe(0);
  });

  it('finds the longest run of consecutive days', () => {
    expect(
      longestStreak([
        '2026-01-01',
        '2026-01-02',
        '2026-01-04',
        '2026-01-05',
        '2026-01-06',
        '2026-01-08',
      ]),
    ).toBe(3);
  });

  it('ignores order and duplicates', () => {
    expect(
      longestStreak(['2026-01-03', '2026-01-01', '2026-01-02', '2026-01-02']),
    ).toBe(3);
  });

  it('counts across a month and a year boundary', () => {
    expect(longestStreak(['2025-12-30', '2025-12-31', '2026-01-01'])).toBe(3);
    expect(longestStreak(['2026-02-27', '2026-02-28', '2026-03-01'])).toBe(3);
  });

  it('counts a leap day', () => {
    expect(longestStreak(['2024-02-28', '2024-02-29', '2024-03-01'])).toBe(3);
  });
});

describe('dayNumber', () => {
  it('advances by exactly one per calendar day', () => {
    expect(dayNumber('2026-03-29') - dayNumber('2026-03-28')).toBe(1);
    expect(dayNumber('2026-10-25') - dayNumber('2026-10-24')).toBe(1);
  });
});

describe('elapsedFraction', () => {
  const range = {
    start: new Date('2026-05-04T00:00:00Z'),
    end: new Date('2026-05-11T00:00:00Z'),
  };

  it('is 0 before the period and 1 after it', () => {
    expect(elapsedFraction(range, new Date('2026-05-01T00:00:00Z'))).toBe(0);
    expect(elapsedFraction(range, new Date('2026-06-01T00:00:00Z'))).toBe(1);
  });

  it('is proportional inside the period', () => {
    expect(
      elapsedFraction(range, new Date('2026-05-07T12:00:00Z')),
    ).toBeCloseTo(0.5, 5);
  });

  it('treats an empty range as fully elapsed', () => {
    const empty = { start: range.start, end: range.start };

    expect(elapsedFraction(empty, range.start)).toBe(1);
  });
});

describe('precedingPeriodRanges', () => {
  it.each([
    [StatsPeriod.WEEK, 8],
    [StatsPeriod.MONTH, 6],
  ])('returns %s ranges, newest first, with no gap or overlap', (period, n) => {
    const ranges = precedingPeriodRanges(period, '2026-05-21T10:00:00Z', n);

    expect(ranges).toHaveLength(n);
    for (let i = 0; i < ranges.length - 1; i++)
      // the next older range ends 1 ms before the newer one starts
      expect(+ranges[i].start - +ranges[i + 1].end).toBe(1);
  });

  it('ends right before the period that contains the date', () => {
    const [newest] = precedingPeriodRanges(
      StatsPeriod.MONTH,
      '2026-05-21T10:00:00Z',
      1,
    );

    expect(newest.start.getMonth()).toBe(3);
    expect(newest.end.getMonth()).toBe(3);
  });

  it('crosses the year boundary', () => {
    const ranges = precedingPeriodRanges(
      StatsPeriod.MONTH,
      '2026-02-10T10:00:00Z',
      3,
    );

    expect(ranges.map((r) => r.start.getMonth())).toEqual([0, 11, 10]);
    expect(ranges[1].start.getFullYear()).toBe(2025);
  });
});
