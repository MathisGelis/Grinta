import catalogue from '../exercise/data/base-exercises.json';
import { Goal } from '../users/enums/goal.enum';
import { TrainingLevel } from '../users/enums/level.enum';
import { TrainingLocation } from '../users/enums/training-location.enum';
import { rankTemplates, WORKOUT_TEMPLATES } from './template-catalogue';

const names = new Set(
  (catalogue as Array<{ name: string }>).map((e) => e.name),
);
const top = (criteria: Parameters<typeof rankTemplates>[0]) =>
  rankTemplates(criteria)
    .filter((r) => r.recommended)
    .map((r) => r.template.key);

describe('workout templates', () => {
  it.each(WORKOUT_TEMPLATES.map((t) => [t.key, t]))(
    '%s is consistent with the catalogue',
    (_key, template) => {
      const keys = new Set(template.workouts.map((w) => w.key));

      expect(template.week).toHaveLength(7);
      expect(template.week.filter(Boolean)).toHaveLength(template.daysPerWeek);
      for (const day of template.week)
        if (day) expect(keys.has(day)).toBe(true);
      for (const workout of template.workouts)
        for (const move of workout.moves) {
          expect(names.has(move.exercise)).toBe(true);
          expect(move.sets).toBeGreaterThan(0);
          expect(move.reps).toBeGreaterThan(0);
        }
    },
  );

  it('has unique keys', () => {
    const keys = WORKOUT_TEMPLATES.map((t) => t.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('recommends by goal, level, days and location', () => {
    expect(
      top({
        goal: Goal.GAIN_WEIGHT,
        level: TrainingLevel.ADVANCED,
        daysPerWeek: 6,
        location: TrainingLocation.GYM,
      })[0],
    ).toBe('ppl-6');
    expect(
      top({
        goal: Goal.GAIN_WEIGHT,
        level: TrainingLevel.INTERMEDIATE,
        daysPerWeek: 4,
      })[0],
    ).toBe('upper-lower-4');
    expect(
      top({ goal: Goal.LEARN_BASICS, level: TrainingLevel.BEGINNER })[0],
    ).toBe('beginner-2');
    expect(top({ goal: Goal.FLEXIBILITY })[0]).toBe('mobility-3');
    expect(top({ goal: Goal.LOSE_WEIGHT, daysPerWeek: 4 })[0]).toBe(
      'fat-loss-4',
    );
  });

  it('only recommends home templates to someone training at home', () => {
    const keys = top({
      goal: Goal.GAIN_WEIGHT,
      location: TrainingLocation.HOME,
    });
    const home = new Set(
      WORKOUT_TEMPLATES.filter((t) => t.location === TrainingLocation.HOME).map(
        (t) => t.key,
      ),
    );

    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) expect(home.has(key)).toBe(true);
  });

  it('recommends nothing without any answer, but lists everything', () => {
    const ranked = rankTemplates({});

    expect(ranked).toHaveLength(WORKOUT_TEMPLATES.length);
    expect(ranked.some((r) => r.recommended)).toBe(false);
  });
});
