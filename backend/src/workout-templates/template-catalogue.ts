import { Goal } from '../users/enums/goal.enum';
import { TrainingLevel } from '../users/enums/level.enum';
import { TrainingLocation } from '../users/enums/training-location.enum';

/**
 * Ready-made programmes offered at onboarding and in « Créer une séance ».
 * Exercises are named as in the catalogue (base-exercises.json); a unit test
 * checks every name exists. Weights are left at 0: the user knows their own
 * loads, the template only gives sets, reps and rest.
 */
export interface TemplateMove {
  exercise: string;
  sets: number;
  reps: number;
  restSeconds: number;
  /** For timed moves (plank, stretching): seconds per set, shown as a hint. */
  durationSeconds?: number;
}

export interface TemplateWorkout {
  key: string;
  title: string;
  estimatedDurationMinutes: number;
  moves: TemplateMove[];
}

export interface WorkoutTemplate {
  key: string;
  title: string;
  description: string;
  goals: Goal[];
  levels: TrainingLevel[];
  daysPerWeek: number;
  location: TrainingLocation;
  workouts: TemplateWorkout[];
  /** One week, Monday first: a workout key per day, null for rest. */
  week: (string | null)[];
}

const m = (
  exercise: string,
  sets: number,
  reps: number,
  restSeconds = 90,
  durationSeconds?: number,
): TemplateMove => ({ exercise, sets, reps, restSeconds, durationSeconds });

/** A timed move: one rep per set, its duration as a hint. */
const timed = (exercise: string, sets: number, seconds: number, rest = 45) =>
  m(exercise, sets, 1, rest, seconds);

const { BEGINNER, INTERMEDIATE, ADVANCED } = TrainingLevel;
const { GYM, HOME } = TrainingLocation;

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    key: 'ppl-6',
    title: 'Push Pull Legs',
    description:
      'Six séances par semaine : poussée, tirage, jambes, deux fois. Pour ' +
      'prendre du muscle avec un gros volume.',
    goals: [Goal.GAIN_WEIGHT, Goal.GET_FITTER],
    levels: [INTERMEDIATE, ADVANCED],
    daysPerWeek: 6,
    location: GYM,
    workouts: [
      {
        key: 'push',
        title: 'Push : pecs, épaules, triceps',
        estimatedDurationMinutes: 70,
        moves: [
          m('Bench Press (Barbell)', 4, 6, 150),
          m('Bench Press (Incline, Dumbbell)', 3, 10, 120),
          m('Overhead Press (Barbell)', 3, 8, 120),
          m('Lateral Raise (Standing, Dumbbell)', 3, 15, 60),
          m('Triceps Pushdown (Rope)', 3, 12, 60),
          m('Chest Dip (Bodyweight)', 2, 10, 90),
        ],
      },
      {
        key: 'pull',
        title: 'Pull : dos, biceps',
        estimatedDurationMinutes: 70,
        moves: [
          m('Deadlift (Barbell)', 3, 5, 180),
          m('Pull Up', 3, 8, 120),
          m('Bent Over Row (Barbell)', 3, 8, 120),
          m('Lat Pulldown (Cable)', 3, 10, 90),
          m('Face Pull', 3, 15, 60),
          m('Bicep Curl (Barbell)', 3, 10, 60),
        ],
      },
      {
        key: 'legs',
        title: 'Legs : jambes, fessiers',
        estimatedDurationMinutes: 70,
        moves: [
          m('Squat (Barbell)', 4, 6, 180),
          m('Romanian Deadlift (Barbell)', 3, 8, 120),
          m('Leg Press (Machine)', 3, 12, 120),
          m('Hamstring Leg Curl (Lying, Machine)', 3, 12, 60),
          m('Calf Raise (Machine)', 4, 15, 60),
        ],
      },
    ],
    week: ['push', 'pull', 'legs', 'push', 'pull', 'legs', null],
  },
  {
    key: 'upper-lower-4',
    title: 'Haut / Bas du corps',
    description:
      'Quatre séances par semaine, en alternant haut et bas du corps. Un bon ' +
      'équilibre entre volume et récupération.',
    goals: [Goal.GAIN_WEIGHT, Goal.GET_FITTER],
    levels: [INTERMEDIATE, ADVANCED],
    daysPerWeek: 4,
    location: GYM,
    workouts: [
      {
        key: 'upper',
        title: 'Haut du corps',
        estimatedDurationMinutes: 65,
        moves: [
          m('Bench Press (Barbell)', 4, 6, 150),
          m('Bent Over Row (Barbell)', 4, 8, 120),
          m('Shoulder Press (Dumbbell)', 3, 10, 90),
          m('Lat Pulldown (Cable)', 3, 10, 90),
          m('Bicep Curl (Standing, Dumbbell)', 3, 12, 60),
          m('Triceps Pushdown (Rope)', 3, 12, 60),
        ],
      },
      {
        key: 'lower',
        title: 'Bas du corps',
        estimatedDurationMinutes: 60,
        moves: [
          m('Squat (Barbell)', 4, 6, 180),
          m('Hip Thrust (Barbell)', 3, 10, 120),
          m('Romanian Deadlift (Barbell)', 3, 8, 120),
          m('Quad Leg Extension (Machine)', 3, 12, 60),
          m('Calf Raise (Machine)', 4, 15, 60),
        ],
      },
    ],
    week: ['upper', 'lower', null, 'upper', 'lower', null, null],
  },
  {
    key: 'full-body-3',
    title: 'Full body',
    description:
      'Trois séances par semaine qui travaillent tout le corps, en ' +
      'alternant deux variantes. Simple et efficace.',
    goals: [Goal.GET_FITTER, Goal.GAIN_WEIGHT, Goal.LOSE_WEIGHT],
    levels: [BEGINNER, INTERMEDIATE],
    daysPerWeek: 3,
    location: GYM,
    workouts: [
      {
        key: 'full-a',
        title: 'Full body A',
        estimatedDurationMinutes: 60,
        moves: [
          m('Squat (Barbell)', 3, 8, 150),
          m('Bench Press (Barbell)', 3, 8, 120),
          m('Bent Over Row (Barbell)', 3, 10, 120),
          m('Shoulder Press (Dumbbell)', 3, 10, 90),
          timed('Plank', 3, 45),
        ],
      },
      {
        key: 'full-b',
        title: 'Full body B',
        estimatedDurationMinutes: 60,
        moves: [
          m('Deadlift (Barbell)', 3, 5, 180),
          m('Bench Press (Incline, Dumbbell)', 3, 10, 120),
          m('Lat Pulldown (Cable)', 3, 10, 90),
          m('Walking Lunge (Dumbbell)', 3, 12, 90),
          m('Crunch (Bodyweight)', 3, 15, 45),
        ],
      },
    ],
    week: ['full-a', null, 'full-b', null, 'full-a', null, null],
  },
  {
    key: 'beginner-2',
    title: 'Débutant',
    description:
      'Deux séances par semaine sur machines et poids du corps, pour ' +
      'apprendre les mouvements de base en sécurité.',
    goals: [Goal.LEARN_BASICS, Goal.GET_FITTER],
    levels: [BEGINNER],
    daysPerWeek: 2,
    location: GYM,
    workouts: [
      {
        key: 'discovery-a',
        title: 'Découverte A',
        estimatedDurationMinutes: 45,
        moves: [
          m('Leg Press (Machine)', 3, 12, 90),
          m('Chest Press (Machine)', 3, 12, 90),
          m('Lat Pulldown (Cable)', 3, 12, 90),
          m('Hamstring Leg Curl (Seated, Machine)', 2, 12, 60),
          timed('Plank', 3, 30),
        ],
      },
      {
        key: 'discovery-b',
        title: 'Découverte B',
        estimatedDurationMinutes: 45,
        moves: [
          m('Goblet Squat', 3, 10, 90),
          m('Seated Row - V Handle', 3, 12, 90),
          m('Shoulder Press (Dumbbell)', 3, 10, 90),
          m('Glute Bridge', 3, 15, 60),
          m('Dead Bug', 3, 10, 45),
        ],
      },
    ],
    week: ['discovery-a', null, null, 'discovery-b', null, null, null],
  },
  {
    key: 'home-bodyweight-3',
    title: 'Maison sans matériel',
    description:
      'Trois séances au poids du corps, sans aucun matériel. À faire dans ' +
      'le salon.',
    goals: [Goal.GET_FITTER, Goal.LOSE_WEIGHT, Goal.LEARN_BASICS],
    levels: [BEGINNER, INTERMEDIATE],
    daysPerWeek: 3,
    location: HOME,
    workouts: [
      {
        key: 'home-a',
        title: 'Poids du corps A',
        estimatedDurationMinutes: 35,
        moves: [
          m('Squat (Bodyweight)', 4, 15, 60),
          m('Push Up', 4, 10, 60),
          m('Reverse Lunge (Bodyweight)', 3, 12, 60),
          m('Superman', 3, 12, 45),
          timed('Plank', 3, 40),
        ],
      },
      {
        key: 'home-b',
        title: 'Poids du corps B',
        estimatedDurationMinutes: 35,
        moves: [
          m('Glute Bridge', 4, 15, 60),
          m('Pike Pushup', 3, 8, 60),
          m('Bench Dip', 3, 12, 60),
          m('Walking Lunge (Bodyweight)', 3, 16, 60),
          timed('Side Plank', 3, 30),
        ],
      },
    ],
    week: ['home-a', null, 'home-b', null, 'home-a', null, null],
  },
  {
    key: 'fat-loss-4',
    title: 'Renforcement + cardio',
    description:
      'Deux séances de renforcement et deux de cardio par semaine, pour ' +
      'perdre du poids en gardant du muscle.',
    goals: [Goal.LOSE_WEIGHT, Goal.GET_FITTER],
    levels: [BEGINNER, INTERMEDIATE],
    daysPerWeek: 4,
    location: GYM,
    workouts: [
      {
        key: 'strength',
        title: 'Renforcement',
        estimatedDurationMinutes: 50,
        moves: [
          m('Goblet Squat', 3, 12, 75),
          m('Chest Press (Machine)', 3, 12, 75),
          m('Seated Row - V Handle', 3, 12, 75),
          m('Romanian Deadlift (Dumbbell)', 3, 12, 75),
          timed('Plank', 3, 45),
        ],
      },
      {
        key: 'cardio',
        title: 'Cardio',
        estimatedDurationMinutes: 40,
        moves: [
          timed('Warm Up', 1, 300, 30),
          timed('Cycling (Stationary Bike)', 1, 1200, 60),
          m('Burpee', 4, 10, 45),
          timed('Moutain Climber', 4, 30, 30),
          timed('Jump Rope', 3, 60, 45),
        ],
      },
    ],
    week: ['strength', 'cardio', null, 'strength', 'cardio', null, null],
  },
  {
    key: 'mobility-3',
    title: 'Mobilité et souplesse',
    description:
      'Trois séances courtes et douces pour gagner en souplesse et soulager ' +
      'le dos. Sans matériel.',
    goals: [Goal.FLEXIBILITY],
    levels: [BEGINNER, INTERMEDIATE, ADVANCED],
    daysPerWeek: 3,
    location: HOME,
    workouts: [
      {
        key: 'mobility',
        title: 'Mobilité',
        estimatedDurationMinutes: 30,
        moves: [
          m('Torso Rotation', 2, 12, 30),
          m('Bird Dog', 3, 10, 30),
          m('Downward Dog', 3, 8, 30),
          m('Glute Bridge', 3, 12, 30),
          timed('Stretching', 1, 600, 0),
        ],
      },
      {
        key: 'yoga',
        title: 'Yoga et gainage doux',
        estimatedDurationMinutes: 35,
        moves: [
          timed('Yoga', 1, 1200, 60),
          m('Dead Bug', 3, 10, 30),
          timed('Pilates', 1, 600, 0),
        ],
      },
    ],
    week: ['mobility', null, 'yoga', null, 'mobility', null, null],
  },
];

export interface TemplateCriteria {
  goal?: Goal | null;
  level?: TrainingLevel | null;
  daysPerWeek?: number | null;
  location?: TrainingLocation | null;
}

/**
 * How well a template fits the onboarding answers; a missing answer counts
 * for nothing. Training at home rules out the gym templates; a gym user can
 * still be offered the home ones, lower down.
 */
export function templateScore(
  template: WorkoutTemplate,
  criteria: TemplateCriteria,
): number {
  let score = 0;

  if (criteria.goal)
    score +=
      template.goals[0] === criteria.goal
        ? 4
        : template.goals.includes(criteria.goal)
          ? 2
          : -2;
  if (criteria.level)
    score += template.levels.includes(criteria.level) ? 2 : -2;
  if (criteria.daysPerWeek) {
    const gap = Math.abs(template.daysPerWeek - criteria.daysPerWeek);

    score += gap === 0 ? 3 : gap === 1 ? 1 : -gap;
  }
  if (criteria.location === TrainingLocation.HOME)
    score += template.location === TrainingLocation.HOME ? 3 : -10;
  return score;
}

/** How many templates are flagged as recommended. */
export const RECOMMENDED_COUNT = 2;

/** The templates, best fit first; ties keep the catalogue order. */
export function rankTemplates(criteria: TemplateCriteria) {
  return WORKOUT_TEMPLATES.map((template, index) => ({
    template,
    index,
    score: templateScore(template, criteria),
  }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ template, score }, rank) => ({
      template,
      recommended: rank < RECOMMENDED_COUNT && score > 0,
    }));
}
