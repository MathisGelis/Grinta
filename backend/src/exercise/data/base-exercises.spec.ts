import * as fs from 'fs';
import * as path from 'path';
import { DetailedMuscleGroup } from '../enums/detailed-muscle.enum';
import { EquipmentType } from '../enums/equipment-type.enum';
import { ExerciseType } from '../enums/exercise-type.enum';

interface BaseExercise {
  name: string;
  equipment_type: string;
  primary_muscle: string;
  secondary_muscles: string[];
  exercise_type: string;
  description: string;
  instructions: string[];
  image_url: string;
  image_urls: string[];
}

const exercises: BaseExercise[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'base-exercises.json'), 'utf-8'),
);
const PINNED_IMAGES =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/';

describe('base-exercises.json', () => {
  it('only uses values the entity enums accept', () => {
    const muscles = new Set<string>(Object.values(DetailedMuscleGroup));

    for (const e of exercises) {
      expect(Object.values(EquipmentType)).toContain(e.equipment_type);
      expect(Object.values(ExerciseType)).toContain(e.exercise_type);
      expect(muscles.has(e.primary_muscle)).toBe(true);
      expect(e.secondary_muscles.every((m) => muscles.has(m))).toBe(true);
    }
  });

  it('uses the entity property name for secondary muscles', () => {
    // The seed copies keys as they are: `secondary_muscle` was silently dropped.
    for (const e of exercises) {
      expect(e).toHaveProperty('secondary_muscles');
      expect(e).not.toHaveProperty('secondary_muscle');
    }
  });

  it('describes every exercise and explains how to perform it', () => {
    for (const e of exercises) {
      expect(e.description.length).toBeGreaterThan(20);
      expect(e.description.length).toBeLessThanOrEqual(300);
      expect(e.instructions.length).toBeGreaterThanOrEqual(2);
      expect(e.instructions.every((s) => s.trim().length > 10)).toBe(true);
    }
  });

  it('gives either no photo or a start and end photo from the pinned source', () => {
    for (const e of exercises) {
      if (!e.image_urls.length) {
        expect(e.image_url).toBe('');
        continue;
      }
      expect(e.image_urls).toHaveLength(2);
      expect(e.image_url).toBe(e.image_urls[0]);
      for (const url of e.image_urls)
        expect(url.startsWith(PINNED_IMAGES)).toBe(true);
      expect(e.image_urls[0].endsWith('/0.jpg')).toBe(true);
      expect(e.image_urls[1].endsWith('/1.jpg')).toBe(true);
    }
  });
});
