/** Common French profanity and insults. */
const FRENCH_PROFANITY: string[] = [
  'merde',
  'putain',
  'put1',
  'connard',
  'conard',
  'connasse',
  'salope',
  'salaud',
  'encule',
  'encule',
  'enfoire',
  'enfoire',
  'pute',
  'petasse',
  'pouffiasse',
  'ducon',
  'debile',
  'abruti',
  'cretin',
  'batard',
  'niquer',
  'nique',
  'niquez',
  'foutre',
  'chier',
  'chiotte',
  'couillon',
  'branleur',
  'branlette',
  'trouduc',
];

/**
 * French slurs. A moderation filter exists precisely to catch these — they
 * are listed here so they are blocked, not used. Expand with care.
 */
const FRENCH_SLURS: string[] = [
  'pede',
  'tapette',
  'tarlouze',
  'bougnoule',
  'negro',
  'negre',
];

export const EXTRA_BANNED_PATTERNS: string[] = [
  ...FRENCH_PROFANITY,
  ...FRENCH_SLURS,
];
