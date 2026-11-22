/**
 * Usernames are what an @ mention points to, so they only use the characters
 * a mention can contain: lowercase letters without accents, digits, `_` and
 * `.`, with no dot at the start or the end (a trailing dot reads as the end
 * of a sentence: "thanks @paul."). Length is checked separately, 3 to 30.
 */
export const USERNAME_PATTERN = /^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$/;

export const USERNAME_RULE_MESSAGE =
  'Le pseudo ne peut contenir que des lettres sans accent, des chiffres, « _ » et « . » (pas au début ni à la fin), sans espace.';

const MIN_LENGTH = 3;
// Room left for the counter that makes a generated username unique.
const MAX_BASE_LENGTH = 25;

/**
 * A valid username base built from a display name: accents removed
 * ("Élodie" gives "elodie"), every other character dropped, padded when too
 * short, cut to leave room for a counter.
 */
export function usernameBaseFrom(displayName: string): string {
  const base = displayName
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, MAX_BASE_LENGTH);

  if (!base) return 'user';
  return base.length < MIN_LENGTH ? base.padEnd(MIN_LENGTH, '_') : base;
}
