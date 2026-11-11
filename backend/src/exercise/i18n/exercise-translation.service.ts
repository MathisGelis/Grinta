import { Injectable } from '@nestjs/common';
import { ExerciseService } from '../exercise.service';
import {
  ExerciseDetailsTranslation,
  loadTranslations,
  LocaleTranslations,
} from './exercise-translations';
import { ExerciseLookup, localizeResponse } from './localize-response';
import { Locale } from './locale';

/** Translates the catalogue exercises of a response into one language. */
@Injectable()
export class ExerciseTranslationService {
  private readonly translations = loadTranslations();

  constructor(private readonly exercises: ExerciseService) {}

  /** The translated name of an English catalogue name, if there is one. */
  name(locale: Locale, englishName: string): string | undefined {
    return this.translations.get(locale)?.names.get(englishName);
  }

  details(
    locale: Locale,
    englishName: string,
  ): ExerciseDetailsTranslation | undefined {
    return this.translations.get(locale)?.details.get(englishName);
  }

  /** Every translated name of an exercise, for matching typed names. */
  allNames(englishName: string): string[] {
    return [...this.translations.values()]
      .map((t: LocaleTranslations) => t.names.get(englishName))
      .filter((n): n is string => !!n);
  }

  async localize<T>(value: T, locale: Locale): Promise<T> {
    const table = this.translations.get(locale);

    if (!table || (!table.names.size && !table.details.size)) return value;
    const names = await this.exercises.namesById();
    const lookup: ExerciseLookup = {
      englishName: (id) => names.get(id),
      name: (english) => table.names.get(english),
      details: (english) => table.details.get(english),
    };

    return localizeResponse(value, lookup) as T;
  }
}
