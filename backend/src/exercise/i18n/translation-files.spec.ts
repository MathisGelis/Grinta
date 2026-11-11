import * as fs from 'fs';
import * as path from 'path';
import {
  baseCatalogueNames,
  ExerciseDetailsTranslation,
  loadTranslations,
  NameSource,
  splitName,
  TRANSLATIONS_DIR,
} from './exercise-translations';
import { SUPPORTED_LOCALES } from './locale';

const catalogue = baseCatalogueNames();
const bases = new Set(catalogue.map((n) => splitName(n).base));
const qualifiers = new Set(catalogue.flatMap((n) => splitName(n).qualifiers));
const read = <T>(file: string): T | null => {
  const full = path.join(TRANSLATIONS_DIR, file);

  return fs.existsSync(full)
    ? (JSON.parse(fs.readFileSync(full, 'utf-8')) as T)
    : null;
};
const locales = SUPPORTED_LOCALES.filter((l) => l !== 'en');

describe.each(locales)('%s translations', (locale) => {
  const source = read<NameSource>(`${locale}.names.json`);
  const details = read<Record<string, ExerciseDetailsTranslation>>(
    `${locale}.details.json`,
  );

  it('translates every base and variant of the catalogue', () => {
    expect(source).not.toBeNull();
    expect([...bases].filter((b) => !source!.bases[b])).toEqual([]);
    expect([...qualifiers].filter((q) => !source!.qualifiers[q])).toEqual([]);
  });

  it('only names catalogue exercises', () => {
    expect(Object.keys(source!.bases).filter((b) => !bases.has(b))).toEqual([]);
    expect(
      Object.keys(source!.qualifiers).filter((q) => !qualifiers.has(q)),
    ).toEqual([]);
    expect(
      Object.keys(source!.overrides ?? {}).filter(
        (n) => !catalogue.includes(n),
      ),
    ).toEqual([]);
    expect(
      Object.keys(details ?? {}).filter((n) => !catalogue.includes(n)),
    ).toEqual([]);
  });

  it('gives every exercise a distinct, non-empty name', () => {
    const names = [...loadTranslations().get(locale)!.names.values()];

    expect(names).toHaveLength(catalogue.length);
    expect(names.every((n) => n.trim().length > 0)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has well-formed details', () => {
    for (const entry of Object.values(details ?? {})) {
      if (entry.description !== undefined)
        expect(entry.description.trim()).not.toBe('');
      if (entry.instructions !== undefined) {
        expect(entry.instructions.length).toBeGreaterThan(0);
        expect(entry.instructions.every((s) => s.trim() !== '')).toBe(true);
      }
    }
  });
});
