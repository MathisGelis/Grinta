/** Lower case, no accents, typographic quotes and ligatures flattened. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`´]/g, "'");
}

/** Drops the plural `s` so that "tractions" and "traction" read the same. */
const stem = (word: string) =>
  word.length > 3 && word.endsWith('s') && !word.endsWith('ss')
    ? word.slice(0, -1)
    : word;

/** The words of a text, normalised and stemmed. */
export function wordsOf(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem);
}
