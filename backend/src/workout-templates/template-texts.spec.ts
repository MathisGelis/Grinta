import { WORKOUT_TEMPLATES } from './template-catalogue';
import {
  localizeTemplate,
  pickTemplateLanguage,
  TEMPLATES_WITH_ENGLISH,
} from './template-texts';

describe('template texts', () => {
  it('has an English wording for every template and workout', () => {
    expect(TEMPLATES_WITH_ENGLISH.sort()).toEqual(
      WORKOUT_TEMPLATES.map((t) => t.key).sort(),
    );
    for (const template of WORKOUT_TEMPLATES) {
      const english = localizeTemplate(template, 'en');

      expect(english.description).not.toBe(template.description);
      english.workouts.forEach((workout) => expect(workout.title).not.toBe(''));
      expect(english.workouts.map((w) => w.key)).toEqual(
        template.workouts.map((w) => w.key),
      );
    }
  });

  it('keeps French untouched and everything else but the texts identical', () => {
    const [template] = WORKOUT_TEMPLATES;

    expect(localizeTemplate(template, 'fr')).toBe(template);
    expect(localizeTemplate(template, 'en').workouts[0].moves).toEqual(
      template.workouts[0].moves,
    );
  });

  it('picks French without a header, and English for any other language', () => {
    expect(pickTemplateLanguage(undefined)).toBe('fr');
    expect(pickTemplateLanguage('fr-FR,fr;q=0.9')).toBe('fr');
    expect(pickTemplateLanguage('en-US')).toBe('en');
    expect(pickTemplateLanguage('de')).toBe('en');
  });
});
