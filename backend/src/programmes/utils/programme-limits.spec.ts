import {
  assertDayNumbers,
  assertStartDateNear,
  MAX_PROGRAMME_DAYS,
} from './programme-limits';

const days = (...numbers: number[]) =>
  numbers.map((dayNumber) => ({ dayNumber }));
const codeOf = (run: () => void) => {
  try {
    run();
  } catch (error) {
    return (error as { getResponse: () => { code: string } }).getResponse()
      .code;
  }
  return null;
};

describe('assertDayNumbers', () => {
  it('accepts 1 to N, in any order', () => {
    expect(codeOf(() => assertDayNumbers(days(1)))).toBeNull();
    expect(codeOf(() => assertDayNumbers(days(1, 2, 3)))).toBeNull();
    expect(codeOf(() => assertDayNumbers(days(3, 1, 2)))).toBeNull();
    expect(
      codeOf(() =>
        assertDayNumbers(
          days(...Array.from({ length: MAX_PROGRAMME_DAYS }, (_, i) => i + 1)),
        ),
      ),
    ).toBeNull();
  });

  it('refuses a duplicate', () => {
    expect(codeOf(() => assertDayNumbers(days(1, 1)))).toBe(
      'DAY_NUMBER_DUPLICATE',
    );
    expect(codeOf(() => assertDayNumbers(days(1, 2, 2, 3)))).toBe(
      'DAY_NUMBER_DUPLICATE',
    );
  });

  it('refuses a gap or a start other than 1', () => {
    expect(codeOf(() => assertDayNumbers(days(1, 3)))).toBe(
      'DAY_NUMBERS_NOT_CONSECUTIVE',
    );
    expect(codeOf(() => assertDayNumbers(days(2, 3)))).toBe(
      'DAY_NUMBERS_NOT_CONSECUTIVE',
    );
    expect(codeOf(() => assertDayNumbers(days(0, 1)))).toBe(
      'DAY_NUMBERS_NOT_CONSECUTIVE',
    );
  });
});

describe('assertStartDateNear', () => {
  const today = '2026-11-18';

  it('accepts a week either way', () => {
    for (const date of ['2026-11-11', '2026-11-18', '2026-11-25'])
      expect(codeOf(() => assertStartDateNear(date, today))).toBeNull();
  });

  it('refuses further than that', () => {
    for (const date of ['2026-11-10', '2026-11-26', '2099-01-01', '1999-01-01'])
      expect(codeOf(() => assertStartDateNear(date, today))).toBe(
        'START_DATE_OUT_OF_RANGE',
      );
  });
});
