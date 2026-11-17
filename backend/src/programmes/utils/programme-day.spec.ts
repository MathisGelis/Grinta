import { daysBetween, programmePositionOn, todayUtc } from './programme-day';

describe('programmePositionOn', () => {
  it('counts the start date as day 1, then one day per calendar day', () => {
    expect(programmePositionOn('2026-10-26', '2026-10-26', 7)).toEqual({
      status: 'running',
      dayNumber: 1,
      cycle: 1,
    });
    expect(programmePositionOn('2026-10-26', '2026-10-27', 7)).toEqual({
      status: 'running',
      dayNumber: 2,
      cycle: 1,
    });
  });

  it('starts over after the last day', () => {
    expect(programmePositionOn('2026-10-26', '2026-11-01', 7)).toMatchObject({
      dayNumber: 7,
      cycle: 1,
    });
    expect(programmePositionOn('2026-10-26', '2026-11-02', 7)).toMatchObject({
      dayNumber: 1,
      cycle: 2,
    });
    expect(programmePositionOn('2026-10-01', '2026-10-30', 3)).toMatchObject({
      dayNumber: 3,
      cycle: 10,
    });
  });

  it('says how long until a programme starting later', () => {
    expect(programmePositionOn('2026-11-02', '2026-10-30', 7)).toEqual({
      status: 'not_started',
      daysUntilStart: 3,
    });
  });
});

describe('daysBetween', () => {
  it('counts calendar days across months, years and DST changes', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });
});

describe('todayUtc', () => {
  it('formats the UTC date', () => {
    expect(todayUtc(new Date('2026-10-30T23:30:00Z'))).toBe('2026-10-30');
  });
});
