import catalogue from '../data/base-exercises.json';
import { NAME_FIXES_2026_10 } from './name-fixes';

const names = new Set(
  (catalogue as Array<{ name: string }>).map((e) => e.name),
);

describe('NAME_FIXES_2026_10', () => {
  it('fixes old names into catalogue entries', () => {
    for (const fix of NAME_FIXES_2026_10) {
      expect(names.has(fix.to)).toBe(true);
      expect(names.has(fix.from)).toBe(false);
    }
  });
});
