import * as fs from 'fs';
import * as path from 'path';
import { Locale, SUPPORTED_LOCALES } from './locale';

export interface ExerciseDetailsTranslation {
  description?: string;
  instructions?: string[];
}

export interface LocaleTranslations {
  /** English catalogue name → translated name. */
  names: Map<string, string>;
  /** English catalogue name → translated description and instructions. */
  details: Map<string, ExerciseDetailsTranslation>;
}

/** Where the translation files live, next to base-exercises.json. */
export const TRANSLATIONS_DIR = path.join(__dirname, '../data/i18n');

function readJson<T>(file: string): T | null {
  const full = path.join(TRANSLATIONS_DIR, file);

  return fs.existsSync(full)
    ? (JSON.parse(fs.readFileSync(full, 'utf-8')) as T)
    : null;
}

export interface NameSource {
  /** Name before the brackets: "Bench Press" in "Bench Press (Incline, Dumbbell)". */
  bases: Record<string, string>;
  /** Variants inside the brackets: "Incline", "Dumbbell". */
  qualifiers: Record<string, string>;
  /** Full names translated as a whole, when composing reads badly. */
  overrides?: Record<string, string>;
}

/** Splits "Bench Press (Incline, Dumbbell)" into its base and variants. */
export function splitName(name: string): {
  base: string;
  qualifiers: string[];
} {
  const [, base, inside] = /^(.*?)\s*(?:\((.*)\))?$/.exec(name) ?? [];

  return {
    base: base ?? name,
    qualifiers: inside ? inside.split(',').map((q) => q.trim()) : [],
  };
}

/**
 * The translated name of a catalogue name: its override, else the base and
 * variants translated one by one, in the same "Base (variant, variant)"
 * shape. Undefined when the base has no translation; an untranslated variant
 * stays in English.
 */
export function composeName(
  name: string,
  source: NameSource,
): string | undefined {
  const override = source.overrides?.[name];

  if (override) return override;
  const { base, qualifiers } = splitName(name);
  const translatedBase = source.bases[base];

  if (!translatedBase) return undefined;
  if (!qualifiers.length) return translatedBase;
  return `${translatedBase} (${qualifiers
    .map((q) => source.qualifiers[q] ?? q)
    .join(', ')})`;
}

/**
 * The translations of the catalogue, by language, keyed by the English name
 * (the stable name templates, imports and seeds use). Files:
 * - `<locale>.names.json`: { bases, qualifiers, overrides }, see NameSource;
 * - `<locale>.details.json`: { "Bench Press (Barbell)": { description, instructions } }.
 * Names are composed for every exercise of `catalogueNames`. A missing entry
 * or file falls back to English.
 */
export function loadTranslations(
  catalogueNames: string[] = baseCatalogueNames(),
): Map<Locale, LocaleTranslations> {
  const all = new Map<Locale, LocaleTranslations>();

  for (const locale of SUPPORTED_LOCALES) {
    if (locale === 'en') continue;
    const source = readJson<NameSource>(`${locale}.names.json`);
    const details = readJson<Record<string, ExerciseDetailsTranslation>>(
      `${locale}.details.json`,
    );
    const names = new Map<string, string>();

    if (source)
      for (const name of catalogueNames) {
        const translated = composeName(name, source);

        if (translated) names.set(name, translated);
      }
    all.set(locale, {
      names,
      details: new Map(Object.entries(details ?? {})),
    });
  }
  return all;
}

/** The names of the base catalogue, as seeded. */
export function baseCatalogueNames(): string[] {
  const file = path.join(__dirname, '../data/base-exercises.json');

  return (
    JSON.parse(fs.readFileSync(file, 'utf-8')) as Array<{ name: string }>
  ).map((e) => e.name);
}
