import {
  roundCalories,
  roundEstimate,
  roundLoad,
  roundVolume,
} from './numbers';

describe('rounding rules', () => {
  it('keeps loads as entered, 2 decimals at most', () => {
    expect(roundLoad(62.5)).toBe(62.5);
    expect(roundLoad(1.25)).toBe(1.25);
    expect(roundLoad(80.004)).toBe(80);
  });

  it('gives estimates and averages 1 decimal', () => {
    // 62.5 x (1 + 7/30)
    expect(roundEstimate(77.08333)).toBe(77.1);
    expect(roundEstimate(3.25)).toBe(3.3);
  });

  it('gives volumes and calories as whole numbers', () => {
    expect(roundVolume(762.5)).toBe(763);
    expect(roundCalories(46.6)).toBe(47);
  });
});
