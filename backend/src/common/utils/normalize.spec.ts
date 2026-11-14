import { toLowerTrimmed } from './normalize';

describe('toLowerTrimmed', () => {
  it('trims and lowercases strings', () => {
    expect(toLowerTrimmed({ value: '  Foo@Mail.COM ' })).toBe('foo@mail.com');
  });

  it('leaves non-string values untouched so validators can reject them', () => {
    expect(toLowerTrimmed({ value: 42 })).toBe(42);
    expect(toLowerTrimmed({ value: undefined })).toBeUndefined();
  });
});
