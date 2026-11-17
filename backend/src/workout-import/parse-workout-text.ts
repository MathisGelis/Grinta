import { roundLoad } from '../common/utils/numbers';
import { MAX_SET_WEIGHT_KG } from '../workouts/dto/set-pair.dto';
import { ExerciseMatcher } from './exercise-matcher';
import { normalizeText } from './normalize';

/**
 * Reads workout notes (« dc 45x8 », « tractions 3x10 », « Lundi : push »)
 * with fixed French and English rules, no model involved. Nothing is saved:
 * the result is a draft the app shows for review.
 *
 * Set notations, on one line or on the lines under an exercise:
 * - `3x10` is 3 sets of 10 reps; `45x8` or `45kg x 8` is one set of 8 reps
 *   at 45 kg: the first number is a load when it is above 12 or has a unit;
 * - `4x8x60`, `4x8 60kg`, `4x8 à 60`, `60kg 4x8`, `4x8 @60` add a load;
 * - `3 séries de 10`, `3 sets of 10`, `12/10/8`, `12-10-8`, `15 reps`;
 * - `3x45s`, `3x1min`, `20 min` for timed moves; `lbs` is converted to kg;
 * - `repos 90s`, `rest 2min` for the rest between sets.
 * Day headers (« Lundi », « Jour 2 », « Séance A », « Day 1 », « Push : »)
 * split the notes into the days of a programme; « repos » / « rest » / « off »
 * is a rest day.
 */

export interface DraftSet {
  reps: number;
  weight: number;
}

export interface DraftExercise {
  exerciseId: string;
  name: string;
  sets: DraftSet[];
  /** Seconds per set for a timed move, else null. */
  durationSeconds: number | null;
  plannedRestSeconds: number | null;
  /** Line of the notes the exercise was read from (1-based). */
  line: number;
}

export interface DraftWorkout {
  title: string;
  exercises: DraftExercise[];
}

export interface DraftProgrammeDay {
  dayNumber: number;
  label: string;
  /** Index in `workouts`, null for a rest day. */
  workoutIndex: number | null;
}

export interface UnrecognizedLine {
  line: number;
  text: string;
  reason: 'unknown_exercise' | 'no_exercise';
}

export interface WorkoutDraft {
  workouts: DraftWorkout[];
  programme: { title: string; days: DraftProgrammeDay[] } | null;
  unrecognized: UnrecognizedLine[];
}

const WEEKDAYS = [
  ['lundi', 'monday', 'lun', 'mon'],
  ['mardi', 'tuesday', 'mar', 'tue'],
  ['mercredi', 'wednesday', 'mer', 'wed'],
  ['jeudi', 'thursday', 'jeu', 'thu'],
  ['vendredi', 'friday', 'ven', 'fri'],
  ['samedi', 'saturday', 'sam', 'sat'],
  ['dimanche', 'sunday', 'dim', 'sun'],
];
const WEEKDAY_INDEX = new Map(
  WEEKDAYS.flatMap((names, i) => names.map((name) => [name, i + 1] as const)),
);
const WEEKDAY_RE = new RegExp(
  `^(${[...WEEKDAY_INDEX.keys()].join('|')})\\b[\\s:.,–-]*(.*)$`,
);
const NUMBERED_DAY_RE = /^(?:jour|day|j|d)\s*(\d{1,2})\b[\s:.,–-]*(.*)$/;
const SESSION_RE =
  /^(?:seance|session|workout|training|entrainement|wod)\b[\s:.,–-]*(.*)$/;
const MUSCLES = String.raw`push|pull|legs?|jambes?|upper|lower|haut(?: du corps)?|bas(?: du corps)?|full ?body|pecs?|pectoraux|dos|bras|epaules?|biceps?|triceps?|cardio|abdos?|fessiers?|mollets?|ischios?|quadriceps?`;
/** A split or muscle group alone on its line: « Push », « Pecs / triceps ». */
const SPLIT_RE = new RegExp(
  String.raw`^(?:${MUSCLES})(?:\s*(?:[/&+,-]|et|and)\s*(?:${MUSCLES}))*\s*:?$`,
);
const REST_RE = /^(?:repos|rest|off|recup(?:eration)?)\b[\s:.!]*$/;
const NOTATION_RE =
  /\d\s*x\s*\d|\d\s*(?:series?|sets?|reps?|repetitions?|kg|kilos?|lbs?|min|mn|sec|secondes?|s\b)|\d{1,2}\s*[/-]\s*\d{1,2}/;

const UNIT = String.raw`(kgs?|kilos?|lbs?|livres?)`;
const NUM = String.raw`(\d+(?:\.\d+)?)`;
const TIME_UNIT = String.raw`(minutes?|min|mn|secondes?|sec|s|'|")(?![a-z])`;
const MAX_SETS = 20;
const MAX_REPS = 1000;

const isPounds = (unit?: string) => !!unit && /^(lb|livre)/.test(unit);
const toKg = (value: number, unit?: string) =>
  roundLoad(isPounds(unit) ? value * 0.45359237 : value);
const toSeconds = (value: number, unit?: string) =>
  Math.round(/^(m|')/.test(unit ?? '') ? value * 60 : value);

/** The sets, duration and rest read from one line; `rest` is its name part. */
interface LineSets {
  sets: Array<{ reps: number; weight?: number }>;
  durationSeconds: number | null;
  restSeconds: number | null;
  found: boolean;
  rest: string;
}

function readSets(line: string): LineSets {
  let s = line.replace(/(\d+),(\d{1,2})(?=\s*(?:kg|kilo|lb|x))/g, '$1.$2');
  const sets: LineSets['sets'] = [];
  let durationSeconds: number | null = null;
  let restSeconds: number | null = null;
  let globalWeight: number | undefined;
  const take = (re: RegExp, read: (m: RegExpExecArray) => void) => {
    s = s.replace(re, (...args: unknown[]) => {
      const groups = args.slice(0, -2) as string[];

      read(Object.assign(groups, { index: 0, input: s }) as RegExpExecArray);
      return ' ';
    });
  };
  const repeat = (count: number, set: { reps: number; weight?: number }) => {
    for (let i = 0; i < Math.min(count, MAX_SETS); i++) sets.push({ ...set });
  };

  take(
    new RegExp(
      String.raw`\b(?:repos|rest|recup(?:eration)?)\s*:?\s*${NUM}\s*${TIME_UNIT}?`,
      'g',
    ),
    (m) => {
      const value = Number(m[1]);

      restSeconds = toSeconds(value, m[2] ?? (value <= 5 ? 'min' : 's'));
    },
  );
  take(new RegExp(String.raw`(\d+)\s*x\s*${NUM}\s*${TIME_UNIT}`, 'g'), (m) => {
    durationSeconds = toSeconds(Number(m[2]), m[3]);
    repeat(Number(m[1]), { reps: 1 });
  });
  take(
    new RegExp(
      String.raw`${NUM}\s*${UNIT}?\s*x\s*(\d+)\s*x\s*${NUM}\s*${UNIT}?`,
      'g',
    ),
    (m) => {
      const [a, b, c] = [Number(m[1]), Number(m[3]), Number(m[4])];

      if (m[2] || a > 12 || !Number.isInteger(a))
        repeat(c, { reps: b, weight: toKg(a, m[2]) });
      else repeat(a, { reps: b, weight: toKg(c, m[5]) });
    },
  );
  take(
    new RegExp(
      String.raw`${NUM}\s*${UNIT}?\s*x\s*(\d+)(?:\s*-\s*\d+)?(?!\s*(?:kg|kilo|lb|livre)|\.\d|\d)`,
      'g',
    ),
    (m) => {
      const [a, b] = [Number(m[1]), Number(m[3])];

      if (m[2] || a > 12 || !Number.isInteger(a))
        sets.push({ reps: b, weight: toKg(a, m[2]) });
      else repeat(a, { reps: b });
    },
  );
  take(
    new RegExp(
      String.raw`(?:@|\ba\b|\bat\b|\bavec\b)?\s*${NUM}\s*${UNIT}\b`,
      'g',
    ),
    (m) => (globalWeight = toKg(Number(m[1]), m[2])),
  );
  take(
    new RegExp(String.raw`(?:@|\ba\b|\bat\b)\s*${NUM}(?!\s*x)`, 'g'),
    (m) => {
      globalWeight = toKg(Number(m[1]));
    },
  );
  take(
    /(\d+)\s*(?:series?|sets?)\s*(?:de|of|x|:)?\s*(\d+)(?:\s*-\s*\d+)?\s*(?:reps?|repetitions?)?/g,
    (m) => repeat(Number(m[1]), { reps: Number(m[2]) }),
  );
  take(/(?<![\d.])(\d{1,2})(?:\s*[/-]\s*\d{1,2})+(?![\d.])/g, (m) => {
    for (const reps of m[0].split(/[/-]/).map((n) => Number(n.trim())))
      if (reps > 0) sets.push({ reps });
  });
  take(/(\d+)\s*(?:reps?|repetitions?)\b/g, (m) =>
    sets.push({ reps: Number(m[1]) }),
  );
  take(new RegExp(String.raw`${NUM}\s*${TIME_UNIT}`, 'g'), (m) => {
    durationSeconds = toSeconds(Number(m[1]), m[2]);
    sets.push({ reps: 1 });
  });

  const valid = sets.filter(
    (set) =>
      set.reps >= 1 &&
      set.reps <= MAX_REPS &&
      (set.weight ?? globalWeight ?? 0) <= MAX_SET_WEIGHT_KG,
  );

  return {
    sets: valid.map((set) => ({
      reps: set.reps,
      weight: set.weight ?? globalWeight,
    })),
    durationSeconds,
    restSeconds,
    found: sets.length > 0 || restSeconds !== null,
    rest: s
      .replace(/\b(?:x|kgs?|lbs?|reps?|series?|sets?|min|sec)\b/g, ' ')
      .replace(/\d+/g, ' '),
  };
}

/** Strips list bullets and numbering: « - », « • », « 1. », « 2) ». */
const stripBullet = (line: string) =>
  line.replace(/^[\s\-–—•·*>+]+/, '').replace(/^\d+\s*[.)]\s+/, '');

type Header =
  | { kind: 'weekday'; day: number; title: string; rest: boolean }
  | { kind: 'numbered'; day: number; title: string; rest: boolean }
  | { kind: 'session'; title: string; rest: boolean };

function readHeader(
  original: string,
  normalized: string,
  matcher: ExerciseMatcher,
): Header | null {
  if (NOTATION_RE.test(normalized)) return null;
  // The title keeps the user's spelling: the first word (and its number) go.
  const tail = original
    .replace(/^\S+(?:\s*\d+)?[\s:.,–-]*/, '')
    .replace(/[\s:]+$/, '');
  const restOf = (text: string) => REST_RE.test(text.trim());
  const weekday = WEEKDAY_RE.exec(normalized);

  if (weekday)
    return {
      kind: 'weekday',
      day: WEEKDAY_INDEX.get(weekday[1])!,
      title: tail,
      rest: restOf(weekday[2]),
    };
  const numbered = NUMBERED_DAY_RE.exec(normalized);

  if (numbered)
    return {
      kind: 'numbered',
      day: Number(numbered[1]),
      title: tail,
      rest: restOf(numbered[2]),
    };
  if (SESSION_RE.test(normalized))
    return {
      kind: 'session',
      title: original.replace(/[\s:]+$/, ''),
      rest: false,
    };
  if (REST_RE.test(normalized))
    return { kind: 'session', title: original, rest: true };
  if (SPLIT_RE.test(normalized))
    return {
      kind: 'session',
      title: original.replace(/[\s:]+$/, ''),
      rest: false,
    };
  // « Développé couché : » announces the sets of the lines below.
  if (
    /:\s*$/.test(normalized) &&
    /[a-z]/.test(normalized) &&
    !matcher.match(normalized.replace(/:\s*$/, ''))
  )
    return {
      kind: 'session',
      title: original.replace(/[\s:]+$/, ''),
      rest: false,
    };
  return null;
}

interface Section {
  header: Header | null;
  label: string;
  exercises: DraftExercise[];
}

export const MAX_IMPORT_LINES = 300;

export function parseWorkoutText(
  text: string,
  matcher: ExerciseMatcher,
): WorkoutDraft {
  const sections: Section[] = [{ header: null, label: '', exercises: [] }];
  const unrecognized: UnrecognizedLine[] = [];
  let last: DraftExercise | null = null;

  text
    .split(/\r?\n/)
    .slice(0, MAX_IMPORT_LINES)
    .forEach((raw, i) => {
      const line = i + 1;
      const original = stripBullet(raw.trim()).trim();
      const normalized = normalizeText(original).replace(/[×✕*]/g, 'x');

      if (!/[a-z0-9]/.test(normalized)) return;
      const header = readHeader(original, normalized, matcher);

      if (header) {
        sections.push({
          header,
          label: original.replace(/[\s:]+$/, ''),
          exercises: [],
        });
        last = null;
        return;
      }
      const read = readSets(normalized);
      const name = read.rest.replace(/[^a-z' ]+/g, ' ').trim();
      const sets = read.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight ?? 0,
      }));

      if (!/[a-z]{2,}|^[a-z]$/.test(name)) {
        // Sets on their own line belong to the exercise above.
        if (read.found && last) {
          last.sets.push(...sets);
          last.durationSeconds ??= read.durationSeconds;
          last.plannedRestSeconds ??= read.restSeconds;
        } else
          unrecognized.push({ line, text: original, reason: 'no_exercise' });
        return;
      }
      const exercise = matcher.match(name);

      if (!exercise) {
        unrecognized.push({ line, text: original, reason: 'unknown_exercise' });
        last = null;
        return;
      }
      last = {
        exerciseId: exercise.id,
        name: exercise.name,
        sets,
        durationSeconds: read.durationSeconds,
        plannedRestSeconds: read.restSeconds,
        line,
      };
      sections[sections.length - 1].exercises.push(last);
    });

  return { ...assemble(sections), unrecognized };
}

/** One workout, or a programme when the notes have at least two days. */
function assemble(sections: Section[]): Omit<WorkoutDraft, 'unrecognized'> {
  const [loose, ...days] = sections;
  const titled = (s: Section, fallback: string) =>
    s.header?.title || s.label || fallback;

  if (days.length < 2) {
    const all = [...loose.exercises, ...(days[0]?.exercises ?? [])];

    return {
      workouts: all.length
        ? [
            {
              title: days[0]
                ? titled(days[0], 'Séance importée')
                : 'Séance importée',
              exercises: all,
            },
          ]
        : [],
      programme: null,
    };
  }
  const entries = loose.exercises.length
    ? [{ header: null, label: 'Séance 1', exercises: loose.exercises }, ...days]
    : days;
  const workouts: DraftWorkout[] = [];
  const planned = entries.map((section, i) => {
    const isRest = section.header?.rest || !section.exercises.length;
    let workoutIndex: number | null = null;

    if (!isRest) {
      workoutIndex = workouts.length;
      workouts.push({
        title: titled(section, `Séance ${workouts.length + 1}`),
        exercises: section.exercises,
      });
    }
    return { section, position: i + 1, workoutIndex };
  });
  const byWeekday = planned.every((p) => p.section.header?.kind === 'weekday');
  const numbered = planned.every((p) => p.section.header?.kind === 'numbered');
  const numberOf = (p: (typeof planned)[number]) =>
    p.section.header && 'day' in p.section.header
      ? p.section.header.day
      : p.position;
  const used = new Set<number>();
  const result: DraftProgrammeDay[] = [];

  for (const p of planned) {
    let dayNumber = byWeekday || numbered ? numberOf(p) : p.position;

    // A day named twice keeps its first slot; the next one goes after.
    while (used.has(dayNumber) || dayNumber < 1) dayNumber++;
    used.add(dayNumber);
    result.push({
      dayNumber,
      label: p.section.label,
      workoutIndex: p.workoutIndex,
    });
  }
  // A weekly plan stays weekly: the days the notes skip are rest days.
  if (byWeekday)
    for (let day = 1; day <= 7; day++)
      if (!used.has(day))
        result.push({
          dayNumber: day,
          label: WEEKDAYS[day - 1][0].replace(/^./, (c) => c.toUpperCase()),
          workoutIndex: null,
        });

  return {
    workouts,
    programme: {
      title: 'Programme importé',
      days: result.sort((a, b) => a.dayNumber - b.dayNumber),
    },
  };
}
