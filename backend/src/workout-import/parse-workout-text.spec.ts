import catalogue from '../exercise/data/base-exercises.json';
import { ExerciseMatcher } from './exercise-matcher';
import { parseWorkoutText } from './parse-workout-text';

// The real catalogue, with the names as ids.
const matcher = new ExerciseMatcher(
  (catalogue as Array<{ name: string }>).map((e) => ({
    id: e.name,
    name: e.name,
  })),
);
const parse = (text: string) => parseWorkoutText(text, matcher);
const only = (line: string) => {
  const draft = parse(line);

  expect(draft.unrecognized).toEqual([]);
  expect(draft.workouts).toHaveLength(1);
  expect(draft.workouts[0].exercises).toHaveLength(1);
  return draft.workouts[0].exercises[0];
};
const times = (n: number, reps: number, weight = 0) =>
  Array.from({ length: n }, () => ({ reps, weight }));

describe('ExerciseMatcher', () => {
  it('only names catalogue exercises', () => {
    expect(matcher.missingBases()).toEqual([]);
  });

  it.each([
    ['dc', 'Bench Press (Barbell)'],
    ['développé couché', 'Bench Press (Barbell)'],
    ['dc haltères', 'Bench Press (Dumbbell)'],
    ['développé incliné haltères', 'Bench Press (Incline, Dumbbell)'],
    ['dm', 'Overhead Press (Barbell)'],
    ['sdt', 'Deadlift (Barbell)'],
    ['soulevé de terre roumain', 'Romanian Deadlift (Barbell)'],
    ['tractions', 'Pull Up'],
    ['pompes', 'Push Up'],
    ['dips', 'Chest Dip (Bodyweight)'],
    ['dips lestés', 'Chest Dip (Weighted)'],
    ['rowing haltère', 'Bent Over Row (Dumbbell)'],
    ['tirage vertical', 'Lat Pulldown (Cable)'],
    ['curl barre', 'Bicep Curl (Standing, Barbell)'],
    ['curl marteau', 'Hammer Curl (Standing)'],
    ['triceps corde', 'Triceps Pushdown (Rope)'],
    ['presse', 'Leg Press (Machine)'],
    ['fentes marchées', 'Walking Lunge (Dumbbell)'],
    ['leg curl assis', 'Hamstring Leg Curl (Seated, Machine)'],
    ['élévations latérales assis', 'Lateral Raise (Seated, Dumbbell)'],
    ['mollets', 'Calf Raise (Machine)'],
    ['squat pdc', 'Squat (Bodyweight)'],
    ['squat bulgare', 'Bulgarian Split Squat'],
    ['gainage', 'Plank'],
    ['vélo', 'Cycling (Stationary Bike)'],
    ['rameur', 'Rowing Machine'],
    ['Lat Pulldown (Cable)', 'Lat Pulldown (Cable)'],
    ['pendlay row', 'Pendlay Row'],
    ['bench press dumbbell', 'Bench Press (Dumbbell)'],
  ])('reads « %s » as %s', (text, name) => {
    expect(matcher.match(text)?.name).toBe(name);
  });

  it('does not guess from a single split word', () => {
    expect(matcher.match('push')).toBeNull();
    expect(matcher.match('blabla')).toBeNull();
  });
});

describe('parseWorkoutText: sets', () => {
  it('reads 45x8 as a load and 3x10 as sets', () => {
    expect(only('dc 45x8').sets).toEqual([{ reps: 8, weight: 45 }]);
    expect(only('tractions 3x10').sets).toEqual(times(3, 10));
    expect(only('dc 45kg x 8').sets).toEqual([{ reps: 8, weight: 45 }]);
    expect(only('dc 12x8').sets).toEqual(times(12, 8));
  });

  it('applies a load given apart from the sets', () => {
    for (const line of [
      'DC 4x8 à 60kg',
      'dc 4x8 60kg',
      '60kg 4x8 dc',
      'dc 4x8 @60',
      'dc 4x8x60',
      'dc 4×8×60',
    ])
      expect(only(line).sets).toEqual(times(4, 8, 60));
    expect(only('sdt 140x5x3').sets).toEqual(times(3, 5, 140));
  });

  it('reads decimals, pounds and several sets on one line', () => {
    expect(only('dc haltères 3x10 22,5kg').sets).toEqual(times(3, 10, 22.5));
    expect(only('bench 225lbs x 5').sets).toEqual([
      { reps: 5, weight: 102.06 },
    ]);
    expect(only('dc 45x8, 50x6, 55x4').sets).toEqual([
      { reps: 8, weight: 45 },
      { reps: 6, weight: 50 },
      { reps: 4, weight: 55 },
    ]);
  });

  it('reads series, rep lists, ranges and lone reps', () => {
    expect(only('curl barre 3 séries de 12').sets).toEqual(times(3, 12));
    expect(only('curl 3 sets of 12').sets).toEqual(times(3, 12));
    expect(only('squat 10/8/6 à 80kg').sets).toEqual([
      { reps: 10, weight: 80 },
      { reps: 8, weight: 80 },
      { reps: 6, weight: 80 },
    ]);
    expect(only('développé couché 3x8-10').sets).toEqual(times(3, 8));
    expect(only('pompes 20 reps').sets).toEqual(times(1, 20));
  });

  it('reads timed moves and rests', () => {
    expect(only('gainage 3x45s')).toMatchObject({
      sets: times(3, 1),
      durationSeconds: 45,
    });
    expect(only('vélo 20 min')).toMatchObject({ durationSeconds: 1200 });
    expect(only('hip thrust 4x10 100kg repos 2min')).toMatchObject({
      sets: times(4, 10, 100),
      plannedRestSeconds: 120,
    });
    expect(only('dc 3x10 rest 90s').plannedRestSeconds).toBe(90);
  });

  it('keeps an exercise named without sets', () => {
    expect(only('- Développé couché').sets).toEqual([]);
  });

  it('adds the sets of the lines below to the exercise above', () => {
    const exercise = only('Développé couché :\n45x8\n50x6');

    expect(exercise.sets).toEqual([
      { reps: 8, weight: 45 },
      { reps: 6, weight: 50 },
    ]);
  });

  it('refuses impossible loads', () => {
    expect(only('dc 3x10 2000kg').sets).toEqual([]);
  });
});

describe('parseWorkoutText: lines and days', () => {
  it('lists what it could not read', () => {
    const draft = parse('dc 3x10\nunknownthing 3x10\n45x8\n\n---');

    expect(draft.unrecognized).toEqual([
      { line: 2, text: 'unknownthing 3x10', reason: 'unknown_exercise' },
      { line: 3, text: '45x8', reason: 'no_exercise' },
    ]);
    // The lone 45x8 follows an unknown exercise: it is not given to dc.
    expect(draft.workouts[0].exercises[0].sets).toEqual(times(3, 10));
  });

  it('returns one workout without days, titled by its header', () => {
    const draft = parse('Séance du jour\n1. dc 3x10\n2) squat 3x10');

    expect(draft.programme).toBeNull();
    expect(draft.workouts).toEqual([
      expect.objectContaining({ title: 'Séance du jour' }),
    ]);
    expect(draft.workouts[0].exercises.map((e) => e.name)).toEqual([
      'Bench Press (Barbell)',
      'Squat (Barbell)',
    ]);
    expect(parse('dc 3x10').workouts[0].title).toBe('Séance importée');
  });

  it('turns weekdays into a weekly programme', () => {
    const draft = parse(
      [
        'Lundi : Push',
        '- DC 4x8 60kg',
        'Mardi : Pull',
        'Tractions 4x6',
        'Mercredi repos',
        'Jeudi - Jambes',
        'Squat 5x5 100kg',
      ].join('\n'),
    );

    expect(draft.workouts.map((w) => w.title)).toEqual([
      'Push',
      'Pull',
      'Jambes',
    ]);
    expect(
      draft.programme!.days.map((d) => [d.dayNumber, d.workoutIndex]),
    ).toEqual([
      [1, 0],
      [2, 1],
      [3, null],
      [4, 2],
      [5, null],
      [6, null],
      [7, null],
    ]);
  });

  it('numbers « Jour N » days, and splits on headers in English too', () => {
    const numbered = parse('Day 1\ndc 3x10\nDay 3\nsquat 3x10\nDay 2: rest');

    expect(numbered.programme!.days).toEqual([
      { dayNumber: 1, label: 'Day 1', workoutIndex: 0 },
      { dayNumber: 2, label: 'Day 2: rest', workoutIndex: null },
      { dayNumber: 3, label: 'Day 3', workoutIndex: 1 },
    ]);

    const split = parse('Push\nDC 3x8\nPull\nTractions 3x8\nLegs\nSquat 3x8');

    expect(split.workouts.map((w) => w.title)).toEqual([
      'Push',
      'Pull',
      'Legs',
    ]);
    expect(split.programme!.days.map((d) => d.dayNumber)).toEqual([1, 2, 3]);
  });

  it('keeps loose exercises before the first day as a first session', () => {
    const draft = parse('dc 3x10\nJour 2\nsquat 3x10\nJour 3\nsdt 3x5');

    expect(draft.workouts).toHaveLength(3);
    expect(draft.workouts[0].title).toBe('Séance 1');
  });
});
