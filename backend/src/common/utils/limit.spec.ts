import { clampLimit } from './limit';

describe('clampLimit', () => {
  it('keeps a valid value', () => {
    expect(clampLimit(15)).toBe(15);
  });

  it('floors a decimal value', () => {
    expect(clampLimit(7.9)).toBe(7);
  });

  it.each([undefined, null, NaN, 'abc', 0, -5])(
    'falls back to the default for %p',
    (raw) => {
      expect(clampLimit(raw)).toBe(20);
    },
  );

  it('caps oversized values', () => {
    expect(clampLimit(100_000)).toBe(100);
  });

  it('honours custom fallback and cap', () => {
    expect(clampLimit(undefined, 5, 10)).toBe(5);
    expect(clampLimit(50, 5, 10)).toBe(10);
  });
});
