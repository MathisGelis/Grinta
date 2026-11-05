import {
  AliasEntry,
  EXERCISE_ALIASES,
  MODIFIERS,
  WORD_TRANSLATIONS,
} from './import-dictionary';
import { wordsOf } from './normalize';

export interface CatalogueExercise {
  id: string;
  name: string;
}

interface Variant extends CatalogueExercise {
  qualifiers: string[];
  words: string[];
}

export interface MatchedExercise {
  id: string;
  name: string;
}

/** Words that carry no meaning for the fuzzy match. */
const STOP_WORDS = new Set([
  'a',
  'de',
  'du',
  'd',
  'la',
  'le',
  'the',
  'of',
  'en',
]);

const lower = (values: string[] = []) => values.map((v) => v.toLowerCase());

/** Sørensen–Dice coefficient of two word sets. */
function dice(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const common = new Set(a.filter((word) => setB.has(word))).size;

  return (2 * common) / (new Set(a).size + setB.size);
}

/** Finds the longest entry of `index` spelled by consecutive words. */
function longestPhrase<T>(
  words: string[],
  index: Map<string, T>,
  maxLength: number,
): { value: T; start: number; length: number } | null {
  for (let length = Math.min(maxLength, words.length); length > 0; length--)
    for (let start = 0; start + length <= words.length; start++) {
      const value = index.get(words.slice(start, start + length).join(' '));

      if (value !== undefined) return { value, start, length };
    }
  return null;
}

/**
 * Turns the name of an exercise as typed in a note ("dc haltères",
 * "tractions", "Lat Pulldown") into a catalogue exercise. In order:
 * 1. the exact catalogue name, in any word order;
 * 2. a dictionary alias, with modifier words choosing the variant;
 * 3. the closest catalogue name, if close enough.
 */
export class ExerciseMatcher {
  private readonly byBase = new Map<string, Variant[]>();
  private readonly variants: Variant[] = [];
  private readonly aliases = new Map<string, AliasEntry>();
  private readonly modifiers = new Map<string, string>();
  private maxAliasLength = 1;
  private maxModifierLength = 1;

  constructor(catalogue: CatalogueExercise[]) {
    // Modifiers first: the catalogue names are translated with them.
    for (const entry of EXERCISE_ALIASES)
      for (const alias of entry.aliases) {
        const words = wordsOf(alias);

        this.aliases.set(words.join(' '), entry);
        this.maxAliasLength = Math.max(this.maxAliasLength, words.length);
      }
    for (const [word, qualifier] of Object.entries(MODIFIERS)) {
      const words = wordsOf(word);

      this.modifiers.set(words.join(' '), qualifier.toLowerCase());
      this.maxModifierLength = Math.max(this.maxModifierLength, words.length);
    }
    for (const exercise of catalogue) {
      const [, base, qualifiers] =
        /^(.*?)\s*(?:\((.*)\))?$/.exec(exercise.name) ?? [];
      const variant: Variant = {
        ...exercise,
        qualifiers: qualifiers
          ? qualifiers.split(',').map((q) => q.trim().toLowerCase())
          : [],
        words: this.translated(wordsOf(exercise.name)),
      };
      const key = base.toLowerCase();

      this.variants.push(variant);
      this.byBase.set(key, [...(this.byBase.get(key) ?? []), variant]);
    }
  }

  /** The catalogue bases the dictionary names but the catalogue lacks. */
  missingBases(): string[] {
    return EXERCISE_ALIASES.map((entry) => entry.base).filter(
      (base) => !this.byBase.has(base.toLowerCase()),
    );
  }

  match(text: string): MatchedExercise | null {
    const words = wordsOf(text);

    if (!words.length) return null;
    const query = this.translated(words);
    const exact = this.variants.find(
      (v) =>
        v.words.length === query.length &&
        dice(v.words, query) === 1 &&
        new Set(v.words).size === new Set(query).size,
    );

    if (exact) return this.result(exact);
    return this.byAlias(words) ?? this.closest(query, 0.7);
  }

  private byAlias(words: string[]): MatchedExercise | null {
    const found = longestPhrase(words, this.aliases, this.maxAliasLength);

    if (!found) return null;
    const rest = [
      ...words.slice(0, found.start),
      ...words.slice(found.start + found.length),
    ];
    const wanted = new Set(lower(found.value.implies));

    for (let i = 0; i < rest.length; ) {
      const modifier = longestPhrase(
        rest.slice(i),
        this.modifiers,
        this.maxModifierLength,
      );

      if (modifier && modifier.start === 0) {
        wanted.add(modifier.value);
        i += modifier.length;
      } else i++;
    }
    const candidates = this.byBase.get(found.value.base.toLowerCase());

    if (!candidates) return null;
    const defaults = new Set(lower(found.value.defaults));
    const score = (v: Variant) =>
      v.qualifiers.reduce(
        (total, q) => total + (wanted.has(q) ? 3 : defaults.has(q) ? 1 : -2),
        0,
      );
    const best = [...candidates].sort(
      (a, b) =>
        score(b) - score(a) || a.qualifiers.length - b.qualifiers.length,
    )[0];

    return this.result(best);
  }

  private closest(query: string[], threshold: number): MatchedExercise | null {
    let best: { variant: Variant; score: number } | null = null;

    for (const variant of this.variants) {
      const score = dice(variant.words, query);

      if (
        score >= threshold &&
        (!best ||
          score > best.score ||
          (score === best.score &&
            variant.name.length < best.variant.name.length))
      )
        best = { variant, score };
    }
    return best ? this.result(best.variant) : null;
  }

  /** Modifier and French words in their English catalogue spelling. */
  private translated(words: string[]): string[] {
    return words
      .filter((word) => !STOP_WORDS.has(word))
      .flatMap((word) => {
        const english = this.modifiers.get(word) ?? WORD_TRANSLATIONS[word];

        return english ? wordsOf(english) : [word];
      });
  }

  private result(variant: Variant): MatchedExercise {
    return { id: variant.id, name: variant.name };
  }
}
