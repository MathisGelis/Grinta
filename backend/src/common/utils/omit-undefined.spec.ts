import { omitUndefined } from './omit-undefined';

describe('omitUndefined', () => {
  it('drops undefined values and keeps null, zero, empty string and false', () => {
    expect(
      omitUndefined({ a: undefined, b: null, c: 0, d: '', e: false, f: 'x' }),
    ).toEqual({ b: null, c: 0, d: '', e: false, f: 'x' });
  });
});
