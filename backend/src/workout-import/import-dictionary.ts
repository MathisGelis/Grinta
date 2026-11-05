/**
 * The French and English words people type in their notes, mapped to the
 * catalogue. An alias names a catalogue base (the name before the brackets)
 * and the variant to pick when the note does not say; a modifier word picks
 * another variant ("dc haltères" is the dumbbell bench press).
 *
 * Entries are written naturally; they go through the same normalisation as
 * the notes (lower case, no accents, plural `s` dropped) before matching.
 */
export interface AliasEntry {
  aliases: string[];
  base: string;
  /** Qualifiers preferred when the note names none, e.g. Barbell. */
  defaults?: string[];
  /** Qualifiers the alias itself implies, e.g. Incline for "développé incliné". */
  implies?: string[];
}

const A = (
  aliases: string[],
  base: string,
  defaults: string[] = [],
  implies: string[] = [],
): AliasEntry => ({ aliases, base, defaults, implies });

export const EXERCISE_ALIASES: AliasEntry[] = [
  // Chest
  A(
    ['dc', 'developpe couche', 'dev couche', 'bench', 'bench press'],
    'Bench Press',
    ['Barbell'],
  ),
  A(
    [
      'di',
      'developpe incline',
      'dev incline',
      'incline bench',
      'incline press',
    ],
    'Bench Press',
    ['Barbell'],
    ['Incline'],
  ),
  A(
    ['developpe decline', 'dev decline', 'decline bench'],
    'Bench Press',
    ['Barbell'],
    ['Decline'],
  ),
  A(
    ['dc serre', 'developpe couche serre', 'close grip bench'],
    'Bench Press - Close Grip',
  ),
  A(['chest press', 'presse pectoraux', 'developpe machine'], 'Chest Press', [
    'Machine',
  ]),
  A(['ecarte', 'ecartes', 'fly', 'flyes', 'chest fly'], 'Chest Fly', [
    'Dumbbell',
  ]),
  A(['pec deck', 'peck deck', 'butterfly'], 'Chest Fly', ['Machine']),
  A(['vis a vis', 'cable crossover', 'crossover'], 'Chest Fly', ['Cable']),
  A(['dips', 'dip', 'dips pecs'], 'Chest Dip', ['Bodyweight']),
  A(['pompe', 'pompes', 'push up', 'pushup', 'push ups'], 'Push Up'),
  A(['pullover', 'pull over'], 'Lat Pullover'),
  // Shoulders
  A(
    ['dm', 'developpe militaire', 'militaire', 'military press', 'ohp'],
    'Overhead Press',
    ['Barbell'],
  ),
  A(['overhead press'], 'Overhead Press', ['Barbell']),
  A(
    ['developpe epaule', 'developpe epaules', 'shoulder press'],
    'Shoulder Press',
    ['Dumbbell'],
  ),
  A(['arnold', 'developpe arnold', 'arnold press'], 'Arnold Press', ['Seated']),
  A(
    [
      'elevation laterale',
      'elevations laterales',
      'elev lat',
      'lateral raise',
      'lat raise',
    ],
    'Lateral Raise',
    ['Standing', 'Dumbbell'],
  ),
  A(
    ['elevation frontale', 'elevations frontales', 'front raise'],
    'Front Raise',
    ['Dumbbell'],
  ),
  A(
    ['oiseau', 'reverse fly', 'rear delt fly', 'ecarte inverse'],
    'Rear Delt Reverse Fly',
    ['Dumbbell'],
  ),
  A(['face pull', 'tirage visage'], 'Face Pull'),
  A(['tirage menton', 'upright row'], 'Upright Row', ['Barbell']),
  A(
    [
      'shrug',
      'haussement epaule',
      'haussement d epaule',
      'haussements d epaules',
    ],
    'Shrug',
    ['Dumbbell'],
  ),
  // Back
  A(['sdt', 'souleve de terre', 'deadlift', 'dl'], 'Deadlift', ['Barbell']),
  A(
    [
      'rdl',
      'sdt roumain',
      'souleve de terre roumain',
      'romanian deadlift',
      'sdt jambes tendues',
      'jambes tendues',
    ],
    'Romanian Deadlift',
    ['Barbell'],
  ),
  A(
    ['traction', 'tractions', 'pull up', 'pullup', 'traction pronation'],
    'Pull Up',
  ),
  A(['chin up', 'chinup', 'traction supination'], 'Chin Up'),
  A(
    [
      'rowing',
      'rowing barre',
      'row',
      'barbell row',
      'bent over row',
      'rowing penche',
    ],
    'Bent Over Row',
    ['Barbell'],
  ),
  A(['t bar', 'tbar', 'rowing t bar', 't bar row'], 'T Bar Row'),
  A(
    [
      'tirage horizontal',
      'rowing assis',
      'tirage assis',
      'seated row',
      'seated cable row',
    ],
    'Seated Row - V Handle',
  ),
  A(
    [
      'tirage vertical',
      'tirage poitrine',
      'tirage nuque',
      'tirage',
      'lat pulldown',
      'lat pull down',
      'pulldown',
    ],
    'Lat Pulldown',
    ['Cable'],
  ),
  A(
    ['lombaire', 'extension lombaire', 'back extension', 'hyperextension'],
    'Back Extension',
    ['Bodyweight'],
  ),
  // Arms
  A(
    ['curl', 'curl biceps', 'curl bicep', 'bicep curl', 'biceps curl'],
    'Bicep Curl',
    ['Standing', 'Dumbbell'],
  ),
  A(['curl marteau', 'marteau', 'hammer curl', 'hammer'], 'Hammer Curl', [
    'Standing',
  ]),
  A(
    ['curl pupitre', 'pupitre', 'preacher curl', 'larry scott'],
    'Preacher Curl',
    ['EZ Bar'],
  ),
  A(
    [
      'triceps',
      'triceps poulie',
      'triceps corde',
      'extension triceps',
      'extension triceps poulie',
      'pushdown',
      'push down',
      'triceps pushdown',
    ],
    'Triceps Pushdown',
    ['Rope'],
  ),
  A(
    ['barre au front', 'barre front', 'skull crusher', 'skullcrusher'],
    'Skullcrusher',
    ['EZ Bar'],
  ),
  A(
    ['extension nuque', 'extension triceps nuque', 'overhead extension'],
    'Overhead Tricep Extension',
    ['Standing', 'Dumbbell'],
  ),
  A(['kickback triceps', 'triceps kickback'], 'Triceps Kickback'),
  A(['dips triceps', 'dips banc', 'dips sur banc', 'bench dip'], 'Bench Dip'),
  // Legs
  A(['squat', 'back squat'], 'Squat', ['Barbell']),
  A(['front squat', 'squat avant'], 'Front Squat'),
  A(['goblet', 'goblet squat', 'squat goblet'], 'Goblet Squat'),
  A(
    ['squat bulgare', 'bulgare', 'fente bulgare', 'bulgarian split squat'],
    'Bulgarian Split Squat',
  ),
  A(['hack squat', 'hack'], 'Hack Squat', ['Machine']),
  A(['squat saute', 'jump squat'], 'Jump Squat'),
  A(['presse', 'presse a cuisse', 'presse jambes', 'leg press'], 'Leg Press', [
    'Machine',
  ]),
  A(['fente', 'lunge'], 'Lunge', ['Dumbbell']),
  A(['fente marchee', 'walking lunge'], 'Walking Lunge', ['Dumbbell']),
  A(['fente arriere', 'reverse lunge'], 'Reverse Lunge', ['Bodyweight']),
  A(
    ['leg curl', 'ischio', 'curl ischio', 'curl jambe', 'hamstring curl'],
    'Hamstring Leg Curl',
    ['Lying', 'Machine'],
  ),
  A(
    [
      'leg extension',
      'leg ext',
      'extension quadriceps',
      'extension quadri',
      'extension jambe',
    ],
    'Quad Leg Extension',
    ['Machine'],
  ),
  A(
    ['mollet', 'extension mollet', 'calf raise', 'calf', 'calve'],
    'Calf Raise',
    ['Machine'],
  ),
  A(['hip thrust', 'thrust'], 'Hip Thrust', ['Barbell']),
  A(['pont fessier', 'glute bridge', 'pont'], 'Glute Bridge'),
  A(['abduction', 'abducteur', 'hip abduction'], 'Hip Abduction', ['Machine']),
  A(['adduction', 'adducteur', 'hip adduction'], 'Hip Adduction', ['Machine']),
  A(['kickback', 'kickback fessier', 'glute kickback'], 'Glute Kickback', [
    'Cable',
  ]),
  A(['step up', 'montee sur banc'], 'Step Up'),
  A(['box jump', 'saut sur box'], 'Box Jump'),
  // Core
  A(['gainage', 'planche', 'plank', 'gainage ventral'], 'Plank'),
  A(['gainage lateral', 'planche laterale', 'side plank'], 'Side Plank'),
  A(['crunch', 'crunche', 'abdo'], 'Crunch', ['Bodyweight']),
  A(['sit up', 'situp'], 'Sit Up'),
  A(
    ['releve de jambe', 'releve jambe', 'hanging leg raise', 'leg raise'],
    'Hanging Leg Raise',
  ),
  A(['russian twist', 'rotation russe'], 'Russian Twist'),
  A(['roue abdominale', 'roulette', 'ab wheel'], 'Ab Wheel'),
  A(['mountain climber', 'grimpeur'], 'Moutain Climber'),
  // Cardio and mobility
  A(['burpee'], 'Burpee'),
  A(['jumping jack'], 'Jumping Jack'),
  A(['corde a sauter', 'jump rope', 'skipping'], 'Jump Rope'),
  A(['swing', 'kettlebell swing'], 'Swing'),
  A(
    ['course', 'course a pied', 'footing', 'jogging', 'running', 'run'],
    'Running',
  ),
  A(['tapis', 'tapis de course', 'treadmill'], 'Treadmill - Running'),
  A(['velo', 'velo d appartement', 'bike', 'spinning', 'cycling'], 'Cycling', [
    'Stationary Bike',
  ]),
  A(['elliptique', 'velo elliptique', 'elliptical'], 'Elliptical Trainer'),
  A(['rameur', 'rowing machine', 'ergo'], 'Rowing Machine'),
  A(['marche', 'walking', 'walk'], 'Walking'),
  A(['natation', 'nage', 'swimming'], 'Swimming'),
  A(['hiit', 'tabata'], 'HIIT'),
  A(['echauffement', 'warm up', 'warmup'], 'Warm Up'),
  A(['etirement', 'stretching', 'stretch'], 'Stretching'),
  A(['yoga'], 'Yoga'),
  A(['pilate'], 'Pilates'),
];

/** Words that pick a variant: "dc haltères", "curl barre", "leg curl assis". */
export const MODIFIERS: Record<string, string> = {
  haltere: 'Dumbbell',
  halt: 'Dumbbell',
  dumbbell: 'Dumbbell',
  db: 'Dumbbell',
  barre: 'Barbell',
  barbell: 'Barbell',
  bb: 'Barbell',
  poulie: 'Cable',
  cable: 'Cable',
  machine: 'Machine',
  smith: 'Smith Machine',
  'barre guidee': 'Smith Machine',
  guidee: 'Smith Machine',
  kettlebell: 'Kettlebell',
  kb: 'Kettlebell',
  elastique: 'Band',
  band: 'Band',
  incline: 'Incline',
  inclinee: 'Incline',
  decline: 'Decline',
  declinee: 'Decline',
  assis: 'Seated',
  seated: 'Seated',
  debout: 'Standing',
  standing: 'Standing',
  couche: 'Lying',
  allonge: 'Lying',
  lying: 'Lying',
  pdc: 'Bodyweight',
  'poids du corps': 'Bodyweight',
  bodyweight: 'Bodyweight',
  bw: 'Bodyweight',
  leste: 'Weighted',
  lestee: 'Weighted',
  weighted: 'Weighted',
  ez: 'EZ Bar',
  corde: 'Rope',
  rope: 'Rope',
  assiste: 'Assisted',
  assistee: 'Assisted',
  assisted: 'Assisted',
  sumo: 'Sumo',
};

/** Qualifiers meaning no added load: the sets default to 0 kg. */
export const BODYWEIGHT_QUALIFIER = 'Bodyweight';

/** French words translated before the fuzzy match on catalogue names. */
export const WORD_TRANSLATIONS: Record<string, string> = {
  jambe: 'leg',
  epaule: 'shoulder',
  pec: 'chest',
  pectoraux: 'chest',
  dos: 'back',
  fessier: 'glute',
  developpe: 'press',
  tirage: 'pull',
  extension: 'extension',
  souleve: 'deadlift',
};
