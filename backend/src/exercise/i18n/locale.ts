/** The languages of the app. English is the catalogue's own language. */
export const SUPPORTED_LOCALES = [
  'en',
  'fr',
  'es',
  'de',
  'it',
  'pt',
  'ru',
  'zh',
  'ja',
  'ko',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

const SUPPORTED = new Set<string>(SUPPORTED_LOCALES);

/**
 * The best supported language of an Accept-Language header: "fr-FR,fr;q=0.9,
 * en;q=0.8" gives fr. Region subtags are ignored (pt-BR reads as pt), the
 * q weights are honoured, and anything unsupported falls back to English.
 */
export function pickLocale(header: string | string[] | undefined): Locale {
  const value = Array.isArray(header) ? header.join(',') : header;

  if (!value) return DEFAULT_LOCALE;
  const ranked = value
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params
        .map((p) => /^\s*q=([\d.]+)\s*$/.exec(p)?.[1])
        .find((v) => v !== undefined);

      return {
        language: tag.trim().toLowerCase().split(/[-_]/)[0],
        q: q === undefined ? 1 : Number(q),
        index,
      };
    })
    .filter((entry) => entry.q > 0 && SUPPORTED.has(entry.language))
    .sort((a, b) => b.q - a.q || a.index - b.index);

  return (ranked[0]?.language as Locale | undefined) ?? DEFAULT_LOCALE;
}
