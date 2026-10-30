import { tokenStillValid } from './password-state.service';

describe('tokenStillValid', () => {
  const changedAt = new Date('2026-10-30T10:00:00.400Z');
  const second = Math.floor(changedAt.getTime() / 1000);

  it('accepts any token while the password never changed', () => {
    expect(tokenStillValid(1, null)).toBe(true);
  });

  it('refuses tokens issued before the change', () => {
    expect(tokenStillValid(second - 1, changedAt)).toBe(false);
    expect(tokenStillValid(undefined, changedAt)).toBe(false);
  });

  it('accepts the token handed out with the new password', () => {
    expect(tokenStillValid(second, changedAt)).toBe(true);
    expect(tokenStillValid(second + 60, changedAt)).toBe(true);
  });
});
