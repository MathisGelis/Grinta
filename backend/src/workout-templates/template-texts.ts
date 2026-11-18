import { pickLocale } from '../exercise/i18n/locale';
import type { WorkoutTemplate } from './template-catalogue';

/** Languages the template texts are written in. */
export type TemplateLanguage = 'fr' | 'en';

/**
 * French is the language the catalogue is written in, and what a client
 * that sends no Accept-Language keeps getting. With a header, French stays
 * French and every other language reads the English texts below (the other
 * app languages do not have their own wording yet).
 */
export function pickTemplateLanguage(
  header: string | string[] | undefined,
): TemplateLanguage {
  if (!header || (Array.isArray(header) && !header.length)) return 'fr';
  return pickLocale(header) === 'fr' ? 'fr' : 'en';
}

interface TemplateTexts {
  title: string;
  description: string;
  workouts: Record<string, string>;
}

/** English wording of every template, by template key. */
const EN: Record<string, TemplateTexts> = {
  'ppl-6': {
    title: 'Push Pull Legs',
    description:
      'Six workouts a week: push, pull, legs, twice. To build muscle with a high volume.',
    workouts: {
      push: 'Push: chest, shoulders, triceps',
      pull: 'Pull: back, biceps',
      legs: 'Legs: quads, glutes, hamstrings',
    },
  },
  'upper-lower-4': {
    title: 'Upper / Lower body',
    description:
      'Four workouts a week, alternating upper and lower body. A good balance between volume and recovery.',
    workouts: { upper: 'Upper body', lower: 'Lower body' },
  },
  'full-body-3': {
    title: 'Full body',
    description:
      'Three workouts a week that train the whole body, alternating two variations. Simple and effective.',
    workouts: { 'full-a': 'Full body A', 'full-b': 'Full body B' },
  },
  'beginner-2': {
    title: 'Beginner',
    description:
      'Two workouts a week on machines and bodyweight, to learn the basic movements safely.',
    workouts: { 'discovery-a': 'Discovery A', 'discovery-b': 'Discovery B' },
  },
  'home-bodyweight-3': {
    title: 'Home, no equipment',
    description:
      'Three bodyweight workouts with no equipment at all. Do them in your living room.',
    workouts: { 'home-a': 'Bodyweight A', 'home-b': 'Bodyweight B' },
  },
  'fat-loss-4': {
    title: 'Strength + cardio',
    description:
      'Two strength and two cardio workouts a week, to lose weight while keeping muscle.',
    workouts: { strength: 'Strength', cardio: 'Cardio' },
  },
  'mobility-3': {
    title: 'Mobility and flexibility',
    description:
      'Three short, gentle workouts to gain flexibility and ease back pain. No equipment.',
    workouts: { mobility: 'Mobility', yoga: 'Yoga and gentle core' },
  },
};

/** The template with its title, description and workout titles translated. */
export function localizeTemplate(
  template: WorkoutTemplate,
  language: TemplateLanguage,
): WorkoutTemplate {
  const texts = language === 'en' ? EN[template.key] : undefined;

  if (!texts) return template;
  return {
    ...template,
    title: texts.title,
    description: texts.description,
    workouts: template.workouts.map((workout) => ({
      ...workout,
      title: texts.workouts[workout.key] ?? workout.title,
    })),
  };
}

/** Template keys that have an English wording, for the consistency test. */
export const TEMPLATES_WITH_ENGLISH = Object.keys(EN);
