import { compareToRealLife, REAL_LIFE_OBJECTS } from './real-life-comparison';

describe('compareToRealLife', () => {
  it('picks the heaviest object the load reaches', () => {
    expect(compareToRealLife(2_000)).toEqual({ object: 'car', count: 1.3 });
    expect(compareToRealLife(6_000)).toEqual({
      object: 'african_elephant',
      count: 1,
    });
    expect(compareToRealLife(100)).toEqual({ object: 'giant_panda', count: 1 });
  });

  it('never gives a count below 1, rounded down to one decimal', () => {
    expect(compareToRealLife(1_499)).toEqual({ object: 'horse', count: 2.9 });
    for (let kg = 7; kg < 500_000; kg *= 1.37)
      expect(compareToRealLife(kg)!.count).toBeGreaterThanOrEqual(1);
  });

  it('has nothing to compare below the lightest object', () => {
    expect(compareToRealLife(6.9)).toBeNull();
    expect(compareToRealLife(0)).toBeNull();
    expect(compareToRealLife(-5)).toBeNull();
    expect(compareToRealLife(Number.NaN)).toBeNull();
  });

  it('keeps counting with the heaviest object above it', () => {
    expect(compareToRealLife(450_000)).toEqual({
      object: 'statue_of_liberty',
      count: 2,
    });
  });

  it('uses English keys the app can translate', () => {
    for (const key of REAL_LIFE_OBJECTS) expect(key).toMatch(/^[a-z0-9_]+$/);
  });
});
