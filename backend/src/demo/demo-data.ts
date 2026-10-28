import {
  addSession,
  buildExerciseStats,
  ExerciseStatsSnapshot,
  StoredExerciseStats,
  summarizeSession,
} from '../exercise/utils/exercise-history.util';
import {
  previousBestsOf,
  recordsAgainst,
} from '../badges/utils/personal-records.util';
import type { SetPair } from '../workouts/entities/completed-workout.entity';

/**
 * Fictitious data for a demo of the app: people, months of workouts that
 * progress like real training, follows, posts, likes, comments, tagged
 * partners, plans, programmes, and the stats and badges the API would have
 * computed. Pure and deterministic for a given seed and date; the script
 * `demo-seed` writes it. Every account uses DEMO_EMAIL_DOMAIN, which is how
 * the demo data is found again and deleted.
 */
export const DEMO_EMAIL_DOMAIN = 'grinta-demo.example.com';

const DAY = 86_400_000;

export type Rng = () => number;

/** Deterministic pseudo-random numbers (mulberry32). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rng: Rng, list: readonly T[]): T =>
  list[Math.floor(rng() * list.length)];
const between = (rng: Rng, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

function uuid(rng: Rng): string {
  const hex = Array.from({ length: 32 }, () =>
    Math.floor(rng() * 16).toString(16),
  );

  hex[12] = '4';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const h = hex.join('');

  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ---------------------------------------------------------------- people

const FIRST_NAMES = [
  'Léa',
  'Hugo',
  'Chloé',
  'Lucas',
  'Manon',
  'Nathan',
  'Camille',
  'Théo',
  'Inès',
  'Louis',
  'Sarah',
  'Gabriel',
  'Emma',
  'Arthur',
  'Jade',
  'Raphaël',
  'Lina',
  'Jules',
  'Zoé',
  'Adam',
  'Clara',
  'Mathis',
  'Louise',
  'Noah',
  'Alice',
  'Ethan',
  'Anaïs',
  'Maxime',
  'Julie',
  'Yanis',
  'Océane',
  'Tom',
  'Margaux',
  'Enzo',
  'Lisa',
  'Paul',
  'Elisa',
  'Rayan',
  'Romane',
  'Samuel',
];
const LAST_NAMES = [
  'Martin',
  'Bernard',
  'Dubois',
  'Thomas',
  'Robert',
  'Richard',
  'Petit',
  'Durand',
  'Leroy',
  'Moreau',
  'Simon',
  'Laurent',
  'Lefebvre',
  'Michel',
  'Garcia',
  'David',
  'Bertrand',
  'Roux',
  'Vincent',
  'Fournier',
  'Morel',
  'Girard',
  'Andre',
  'Mercier',
  'Dupont',
  'Lambert',
  'Bonnet',
  'Francois',
  'Martinez',
  'Legrand',
  'Garnier',
  'Faure',
  'Rousseau',
  'Blanc',
  'Guerin',
  'Muller',
  'Henry',
  'Roussel',
  'Nicolas',
  'Perrin',
];

type Level = 'beginner' | 'intermediate' | 'advanced';

export interface DemoUser {
  id: string;
  displayName: string;
  uniqueName: string;
  email: string;
  isPublic: boolean;
  birthDate: string;
  height: number;
  weight: number;
  createdAt: Date;
  level: Level;
  split: SplitName;
  /** Sessions per week. */
  frequency: number;
  /** Share of workouts the user publishes. */
  sociability: number;
  /** Weights how often others follow and like this user. */
  popularity: number;
  /** Bench press working weight at the start, scales every lift. */
  strength: number;
  showcase: boolean;
  avatar: boolean;
}

function handleOf(first: string, last: string): string {
  return `${first}.${last}`
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '');
}

// ---------------------------------------------------------------- training

/** ratio: working weight relative to the user's bench press, 0 = bodyweight. */
interface Movement {
  name: string;
  ratio: number;
  sets: [number, number];
  reps: [number, number];
  /** Bodyweight reps at the start for an intermediate lifter. */
  bodyweightReps?: number;
  step: number;
}

const M = (
  name: string,
  ratio: number,
  reps: [number, number],
  step = 5,
  sets: [number, number] = [3, 4],
  bodyweightReps?: number,
): Movement => ({ name, ratio, sets, reps, step, bodyweightReps });

const TEMPLATES = {
  push: {
    title: ['Push', 'Push day', 'Pecs épaules triceps', 'Push 💪'],
    moves: [
      M('Bench Press (Barbell)', 1, [5, 8]),
      M('Bench Press (Incline, Dumbbell)', 0.32, [8, 12], 2),
      M('Overhead Press (Barbell)', 0.62, [6, 10]),
      M('Lateral Raise (Standing, Dumbbell)', 0.12, [12, 15], 1),
      M('Triceps Pushdown (Rope)', 0.35, [10, 15], 2),
      M('Chest Dip (Bodyweight)', 0, [8, 15], 1, [3, 3], 10),
    ],
  },
  pull: {
    title: ['Pull', 'Pull day', 'Dos biceps', 'Back day'],
    moves: [
      M('Deadlift (Barbell)', 1.45, [3, 6]),
      M('Pull Up', 0, [5, 12], 1, [3, 4], 8),
      M('Bent Over Row (Barbell)', 0.8, [6, 10]),
      M('Lat Pulldown (Cable)', 0.75, [8, 12]),
      M('Face Pull', 0.25, [12, 15], 2),
      M('Bicep Curl (Barbell)', 0.38, [8, 12], 2),
    ],
  },
  legs: {
    title: ['Legs', 'Leg day', 'Jambes', 'Leg day 🔥'],
    moves: [
      M('Squat (Barbell)', 1.25, [5, 8]),
      M('Romanian Deadlift (Barbell)', 1, [8, 10]),
      M('Leg Press (Machine)', 2.2, [10, 12], 10),
      M('Hamstring Leg Curl (Lying, Machine)', 0.45, [10, 12], 5),
      M('Calf Raise (Machine)', 0.9, [12, 15], 5),
    ],
  },
  upper: {
    title: ['Haut du corps', 'Upper', 'Upper body'],
    moves: [
      M('Bench Press (Barbell)', 1, [6, 8]),
      M('Bent Over Row (Barbell)', 0.8, [8, 10]),
      M('Shoulder Press (Dumbbell)', 0.3, [8, 12], 2),
      M('Lat Pulldown (Cable)', 0.75, [10, 12]),
      M('Bicep Curl (Standing, Dumbbell)', 0.16, [10, 12], 1),
      M('Triceps Pushdown (Rope)', 0.35, [10, 15], 2),
    ],
  },
  lower: {
    title: ['Bas du corps', 'Lower', 'Jambes fessiers'],
    moves: [
      M('Squat (Barbell)', 1.25, [6, 8]),
      M('Hip Thrust (Barbell)', 1.3, [8, 12]),
      M('Romanian Deadlift (Barbell)', 1, [8, 10]),
      M('Quad Leg Extension (Machine)', 0.6, [10, 15], 5),
      M('Calf Raise (Machine)', 0.9, [12, 15], 5),
    ],
  },
  full: {
    title: ['Full body', 'Full body A', 'Séance complète'],
    moves: [
      M('Squat (Barbell)', 1.2, [6, 10]),
      M('Bench Press (Barbell)', 1, [6, 10]),
      M('Bent Over Row (Barbell)', 0.75, [8, 10]),
      M('Shoulder Press (Dumbbell)', 0.28, [10, 12], 2),
      M('Push Up', 0, [10, 20], 1, [2, 3], 15),
    ],
  },
  home: {
    title: ['Séance maison', 'Poids du corps', 'Home workout'],
    moves: [
      M('Push Up', 0, [10, 25], 1, [3, 4], 15),
      M('Pull Up', 0, [3, 10], 1, [3, 4], 6),
      M('Walking Lunge (Bodyweight)', 0, [12, 20], 1, [3, 3], 14),
      M('Hip Thrust (Bodyweight)', 0, [15, 25], 1, [3, 3], 18),
      M('Crunch (Bodyweight)', 0, [15, 30], 1, [3, 3], 20),
    ],
  },
} as const;

type TemplateName = keyof typeof TEMPLATES;

const SPLITS = {
  ppl: ['push', 'pull', 'legs'],
  upperLower: ['upper', 'lower'],
  fullBody: ['full'],
  home: ['home', 'full'],
} as const satisfies Record<string, readonly TemplateName[]>;

type SplitName = keyof typeof SPLITS;

export const DEMO_EXERCISE_NAMES = [
  ...new Set(
    Object.values(TEMPLATES).flatMap((t) => t.moves.map((m) => m.name)),
  ),
];

const LEVEL = {
  beginner: { bench: [35, 50], weeklyGain: 0.022, bwFactor: 0.55 },
  intermediate: { bench: [60, 85], weeklyGain: 0.009, bwFactor: 1 },
  advanced: { bench: [90, 125], weeklyGain: 0.0035, bwFactor: 1.5 },
} as const;

// ---------------------------------------------------------------- output rows

export interface DemoWorkout {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completionDate: Date;
  createdAt: Date;
  totalDurationSeconds: number;
  exercises: Array<{ id: string; exerciseId: string; sets: SetPair[] }>;
  partnerIds: string[];
}

export interface DemoData {
  users: DemoUser[];
  connections: Array<{
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
  }>;
  plannedWorkouts: Array<{
    id: string;
    userId: string;
    title: string;
    description: string;
    createdAt: Date;
  }>;
  plannedExercises: Array<{
    id: string;
    workoutId: string;
    exerciseId: string;
    sets: SetPair[];
    plannedRestSeconds: number;
  }>;
  programmes: Array<{
    id: string;
    userId: string;
    weekNumber: number;
    difficulty: string;
    locationType: string;
    title: string;
    description: string;
  }>;
  programmeDays: Array<{
    id: string;
    programmeId: string;
    dayNumber: number;
    workoutId: string | null;
  }>;
  workouts: DemoWorkout[];
  posts: Array<{
    id: string;
    userId: string;
    workoutId: string;
    createdAt: Date;
    likesCount: number;
    commentsCount: number;
  }>;
  likes: Array<{ id: string; userId: string; postId: string; createdAt: Date }>;
  comments: Array<{
    id: string;
    userId: string;
    postId: string;
    content: string;
    createdAt: Date;
  }>;
  partners: Array<{
    id: string;
    postId: string;
    userId: string;
    createdAt: Date;
  }>;
  stats: Array<{
    userId: string;
    exerciseId: string;
    stats: StoredExerciseStats;
  }>;
  badges: Array<{
    id: string;
    userId: string;
    exerciseId: string;
    workoutId: string;
    type: string;
    value: number;
    previousValue: number;
    weight: number | null;
    reps: number | null;
    achievedAt: Date;
    createdAt: Date;
  }>;
}

const COMMENTS = [
  'Énorme 🔥',
  'Bien joué !',
  'Propre 💪',
  'Quelle régularité 👏',
  'La forme !',
  'Ça progresse vite',
  'Monstre 😤',
  'Respect',
  'Grosse séance',
  'Belle perf !',
  'Tu lâches rien 💯',
  'On y va demain ?',
  'Inspirant',
  'Trop fort',
  'Je veux le même programme',
  'Solide',
  'Let’s go !',
  'Impressionnant',
  'Bravo pour la constance',
  'Bon courage pour la suite',
];

const DESCRIPTIONS = [
  'Bonne énergie aujourd’hui.',
  'Séance un peu courte mais efficace.',
  'Nouveau programme, première semaine.',
  'Fatigué mais séance faite ✅',
  'Grosse forme ce matin.',
  'Retour après une semaine off.',
  'Focus technique.',
  'Salle bondée mais on a tenu.',
];

/** Stats as the database stores them, without the id of the last workout. */
export function storedStats({
  lastWorkoutId,
  ...stats
}: ExerciseStatsSnapshot): StoredExerciseStats {
  void lastWorkoutId;
  return stats;
}

const roundTo = (value: number, step: number) =>
  Math.max(step, Math.round(value / step) * step);

/**
 * Generates the whole demo. `exerciseIds` maps every DEMO_EXERCISE_NAMES
 * entry to its id in the catalogue; `takenHandles` are usernames already used
 * by real accounts, avoided.
 */
export function generateDemoData(options: {
  seed: number;
  now: Date;
  userCount: number;
  exerciseIds: Map<string, string>;
  takenHandles?: Set<string>;
}): DemoData {
  const rng = createRng(options.seed);
  const now = options.now.getTime();
  const taken = new Set(options.takenHandles ?? []);
  const exerciseId = (name: string) => {
    const id = options.exerciseIds.get(name);

    if (!id)
      throw new Error(`Exercise "${name}" is missing from the catalogue`);
    return id;
  };

  // People. The first one is the showcase account the presenter logs in with.
  const users: DemoUser[] = [];
  const firstNames = [...FIRST_NAMES].sort(() => rng() - 0.5);

  for (let i = 0; i < options.userCount + 1; i++) {
    const showcase = i === 0;
    const first = showcase ? 'Lucas' : firstNames[i % firstNames.length];
    const last = showcase ? 'Moreau' : pick(rng, LAST_NAMES);
    let handle = handleOf(first, last);

    while (taken.has(handle))
      handle = `${handleOf(first, last)}${between(rng, 2, 99)}`;
    taken.add(handle);
    const level: Level = showcase
      ? 'intermediate'
      : pick(rng, [
          'beginner',
          'intermediate',
          'intermediate',
          'advanced',
        ] as const);
    const split: SplitName = showcase
      ? 'ppl'
      : level === 'beginner'
        ? pick(rng, ['fullBody', 'home', 'upperLower'] as const)
        : pick(rng, ['ppl', 'ppl', 'upperLower', 'fullBody'] as const);
    const bench = LEVEL[level].bench;
    const months = showcase ? 6 : between(rng, 2, 6);

    users.push({
      id: uuid(rng),
      displayName: `${first} ${last}`,
      uniqueName: handle,
      email: `${handle}@${DEMO_EMAIL_DOMAIN}`,
      isPublic: showcase || rng() > 0.12,
      birthDate: `${between(rng, 1984, 2006)}-${String(between(rng, 1, 12)).padStart(2, '0')}-${String(between(rng, 1, 28)).padStart(2, '0')}`,
      height: between(rng, 158, 194),
      weight: between(rng, 54, 98),
      createdAt: new Date(now - months * 30 * DAY - between(rng, 0, 10) * DAY),
      level,
      split,
      frequency: showcase ? 4 : between(rng, 2, 5),
      sociability: showcase ? 0.55 : 0.1 + rng() * 0.45,
      popularity: showcase ? 3 : 0.3 + rng() * rng() * 3,
      strength: showcase ? 80 : between(rng, bench[0], bench[1]),
      showcase,
      avatar: showcase || rng() > 0.25,
    });
  }

  // Follows: popular people get followed more. The showcase account follows
  // about twenty people and is followed by most.
  const connections: DemoData['connections'] = [];
  const follows = new Set<string>();
  const follow = (a: DemoUser, b: DemoUser) => {
    const key = `${a.id}>${b.id}`;

    if (a.id === b.id || follows.has(key)) return;
    follows.add(key);
    connections.push({
      id: uuid(rng),
      followerId: a.id,
      followingId: b.id,
      createdAt: new Date(
        Math.min(
          now,
          Math.max(+a.createdAt, +b.createdAt) + between(rng, 1, 20) * DAY,
        ),
      ),
    });
  };
  const totalPopularity = users.reduce((s, u) => s + u.popularity, 0);
  const weightedPick = () => {
    let r = rng() * totalPopularity;

    for (const u of users) if ((r -= u.popularity) <= 0) return u;
    return users[users.length - 1];
  };

  for (const u of users) {
    const target = u.showcase ? 20 : between(rng, 5, 16);

    for (
      let n = 0;
      n < target * 3 &&
      [...follows].filter((k) => k.startsWith(u.id)).length < target;
      n++
    )
      follow(u, weightedPick());
  }
  for (const u of users.slice(1)) if (rng() < 0.75) follow(u, users[0]);
  const followersOf = (id: string) =>
    connections.filter((c) => c.followingId === id).map((c) => c.followerId);

  // Plans and programmes: each user's routine.
  const plannedWorkouts: DemoData['plannedWorkouts'] = [];
  const plannedExercises: DemoData['plannedExercises'] = [];
  const programmes: DemoData['programmes'] = [];
  const programmeDays: DemoData['programmeDays'] = [];

  for (const u of users) {
    const ids: string[] = [];

    for (const name of SPLITS[u.split]) {
      const template = TEMPLATES[name];
      const id = uuid(rng);

      ids.push(id);
      plannedWorkouts.push({
        id,
        userId: u.id,
        title: template.title[0],
        description: `Routine ${template.title[0].toLowerCase()}, ${template.moves.length} exercices.`,
        createdAt: new Date(+u.createdAt + DAY),
      });
      for (const move of template.moves)
        plannedExercises.push({
          id: uuid(rng),
          workoutId: id,
          exerciseId: exerciseId(move.name),
          sets: Array.from({ length: move.sets[1] }, () => ({
            reps: move.reps[1],
            weight: move.ratio
              ? roundTo(u.strength * move.ratio, move.step)
              : 0,
          })),
          plannedRestSeconds: move.ratio >= 1 ? 150 : 90,
        });
    }
    if (u.showcase || rng() < 0.5) {
      const programmeId = uuid(rng);
      const location = u.split === 'home' ? 'HOME' : 'GYM';

      programmes.push({
        id: programmeId,
        userId: u.id,
        weekNumber: 1,
        difficulty: u.level.toUpperCase(),
        locationType: location,
        title: {
          ppl: 'Programme Push Pull Legs',
          upperLower: 'Haut / Bas',
          fullBody: 'Full body 3 jours',
          home: 'Maison sans matériel',
        }[u.split],
        description: 'Ma semaine type.',
      });
      for (let day = 1; day <= 7; day++) {
        const training =
          u.frequency >= 4
            ? day !== 4 && day !== 7
            : day % 2 === 1 && day !== 7;

        programmeDays.push({
          id: uuid(rng),
          programmeId,
          dayNumber: day,
          workoutId: training ? ids[(day - 1) % ids.length] : null,
        });
      }
    }
  }

  // Workouts, week after week, with progressive overload and some noise.
  const workouts: DemoWorkout[] = [];

  for (const u of users) {
    const level = LEVEL[u.level];
    // UTC hours: early morning, lunch break or evening in France.
    const hour = pick(rng, [6, 11, 16, 17, 18]);
    const rotation = SPLITS[u.split];
    let index = 0;
    // A lifter keeps the same number of sets for an exercise, which keeps
    // volume records for real progress.
    const setCounts = new Map<string, number>();
    const start = Math.floor(+u.createdAt / DAY) * DAY + 2 * DAY;

    for (let week = start; week < now; week += 7 * DAY) {
      if (!u.showcase && rng() < 0.08) continue; // a week off
      const days = [
        ...new Set(
          Array.from({ length: u.frequency }, () => between(rng, 0, 6)),
        ),
      ].sort();

      for (const d of days) {
        const date =
          week +
          d * DAY +
          (hour + between(rng, -1, 1)) * 3_600_000 +
          between(rng, 0, 59) * 60_000;
        const weeks = (date - start) / (7 * DAY);
        const duration = between(rng, 45, 85) * 60;

        if (date + duration * 1000 > now) continue;
        const name = rotation[index++ % rotation.length];
        const template = TEMPLATES[name];
        // Progress slows down with time, as it does for real lifters.
        const factor =
          (1 + level.weeklyGain * 10 * Math.log1p(weeks / 10)) *
          (rng() < 0.12 ? 0.94 : 1);
        const exercises = template.moves
          .filter((m, i) => i < 3 || rng() > 0.15)
          .map((move) => {
            if (!setCounts.has(move.name))
              setCounts.set(
                move.name,
                between(rng, move.sets[0], move.sets[1]),
              );
            const setCount = setCounts.get(move.name)!;
            const weight = move.ratio
              ? roundTo(u.strength * move.ratio * factor, move.step)
              : 0;
            // Reps near the top of the range, fewer on an off day.
            const offDay =
              rng() < 0.2 ? between(rng, 1, 3) : between(rng, 0, 1);
            const baseReps = move.ratio
              ? Math.max(move.reps[0], move.reps[1] - offDay)
              : Math.round(
                  (move.bodyweightReps ?? 10) *
                    level.bwFactor *
                    (1 + 0.008 * weeks),
                ) - offDay;

            return {
              id: uuid(rng),
              exerciseId: exerciseId(move.name),
              sets: Array.from({ length: setCount }, (_, s) => ({
                reps: Math.max(
                  1,
                  baseReps - (s === setCount - 1 ? between(rng, 0, 2) : 0),
                ),
                weight,
              })),
            };
          });

        workouts.push({
          id: uuid(rng),
          userId: u.id,
          title: pick(rng, template.title),
          description: rng() < 0.25 ? pick(rng, DESCRIPTIONS) : null,
          completionDate: new Date(date),
          createdAt: new Date(date + duration * 1000),
          totalDurationSeconds: duration,
          exercises,
          partnerIds: [],
        });
      }
    }
  }

  // Posts, likes, comments and tagged partners.
  const posts: DemoData['posts'] = [];
  const likes: DemoData['likes'] = [];
  const comments: DemoData['comments'] = [];
  const partners: DemoData['partners'] = [];
  const byId = new Map(users.map((u) => [u.id, u]));
  const recentFirst = [...workouts].sort(
    (a, b) => +b.completionDate - +a.completionDate,
  );

  for (const w of recentFirst) {
    const author = byId.get(w.userId)!;
    const ageDays = (now - +w.completionDate) / DAY;
    // More recent workouts are published more often, so feeds look alive.
    const chance =
      author.sociability * (ageDays < 21 ? 1.4 : ageDays < 60 ? 0.9 : 0.5);

    if (rng() > chance) continue;
    // Published a little after the workout was saved, unless that is still
    // to come.
    const delayed = +w.createdAt + between(rng, 5, 90) * 60_000;
    const created = delayed <= now ? delayed : +w.createdAt;
    const followers = followersOf(author.id).map((id) => byId.get(id)!);
    const postId = uuid(rng);

    // Trained with friends: the @handles go in the workout title, which is
    // what tags partners in the app, and partners must follow the author.
    if (followers.length && rng() < 0.12) {
      const mates = [...followers]
        .sort(() => rng() - 0.5)
        .slice(0, rng() < 0.75 ? 1 : 2);

      w.title = `${w.title} avec ${mates.map((m) => '@' + m.uniqueName).join(' et ')}`;
      w.partnerIds = mates.map((m) => m.id);
      for (const mate of mates)
        partners.push({
          id: uuid(rng),
          postId,
          userId: mate.id,
          createdAt: new Date(created),
        });
    }
    let likesCount = 0;
    let commentsCount = 0;

    for (const fan of followers) {
      const likeChance = Math.min(
        0.85,
        0.25 * fan.sociability * 4 * author.popularity ** 0.3,
      );

      // Reactions come over the next two days; the ones still to come on
      // the latest posts are left out.
      const likedAt = created + between(rng, 2, 2 * 24 * 60) * 60_000;
      const commentedAt = likedAt + between(rng, 0, 12 * 60) * 60_000;

      if (rng() < likeChance && likedAt <= now) {
        likes.push({
          id: uuid(rng),
          userId: fan.id,
          postId,
          createdAt: new Date(likedAt),
        });
        likesCount++;
        if (rng() < 0.22 && commentedAt <= now) {
          comments.push({
            id: uuid(rng),
            userId: fan.id,
            postId,
            content: pick(rng, COMMENTS),
            createdAt: new Date(commentedAt),
          });
          commentsCount++;
        }
      }
    }
    posts.push({
      id: postId,
      userId: author.id,
      workoutId: w.id,
      createdAt: new Date(created),
      likesCount,
      commentsCount,
    });
  }

  // Stats and badges, replaying each user's workouts in the order they were
  // saved, with the same functions the API uses when a workout is created.
  const stats: DemoData['stats'] = [];
  const badges: DemoData['badges'] = [];

  for (const u of users) {
    const current = new Map<string, StoredExerciseStats>();
    const mine = workouts
      .filter((w) => w.userId === u.id)
      .sort((a, b) => +a.createdAt - +b.createdAt);

    for (const w of mine)
      for (const e of w.exercises) {
        const previous = current.get(e.exerciseId);

        if (!previous) {
          const first = buildExerciseStats([
            {
              workoutId: w.id,
              completedAt: w.completionDate,
              createdAt: w.createdAt,
              sets: e.sets,
            },
          ]);

          if (first) current.set(e.exerciseId, storedStats(first));
          continue;
        }
        for (const record of recordsAgainst(
          summarizeSession(e.sets),
          previousBestsOf(previous),
        ))
          badges.push({
            id: uuid(rng),
            userId: u.id,
            exerciseId: e.exerciseId,
            workoutId: w.id,
            type: record.type,
            value: record.value,
            previousValue: record.previousValue,
            weight: record.weight,
            reps: record.reps,
            achievedAt: w.completionDate,
            createdAt: w.createdAt,
          });
        current.set(
          e.exerciseId,
          addSession(previous, e.sets, w.completionDate),
        );
      }
    for (const [exercise, s] of current)
      stats.push({ userId: u.id, exerciseId: exercise, stats: s });
  }

  return {
    users,
    connections,
    plannedWorkouts,
    plannedExercises,
    programmes,
    programmeDays,
    workouts,
    posts,
    likes,
    comments,
    partners,
    stats,
    badges,
  };
}
