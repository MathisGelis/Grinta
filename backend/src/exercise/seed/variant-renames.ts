import { EquipmentType } from '../enums/equipment-type.enum';

/** Something that can run SQL: a DataSource, an EntityManager or a QueryRunner. */
interface SqlRunner {
  query(sql: string, parameters?: unknown[]): Promise<unknown>;
}

/**
 * October 2026 rename of the catalogue variants. Several entries of
 * base-exercises.json shared one name (Squat existed in 7 equipments) while
 * `exercises.name` is unique, so the seed kept overwriting the same row and
 * only the last variant of each name ever reached the database. Every variant
 * now carries its equipment in its name.
 *
 * Frozen: this list describes a past rename and is used by the
 * RenameExerciseVariants migration and by the seed. Never edit it; a future
 * rename gets its own list.
 */
export const VARIANT_RENAMES_2026_10: ReadonlyArray<{
  from: string;
  equipment: EquipmentType;
  to: string;
}> = [
  {
    from: 'Back Extension',
    equipment: EquipmentType.MACHINE,
    to: 'Back Extension (Machine)',
  },
  {
    from: 'Back Extension',
    equipment: EquipmentType.NONE,
    to: 'Back Extension (Bodyweight)',
  },
  {
    from: 'Baesyan Curl',
    equipment: EquipmentType.CABLE,
    to: 'Baesyan Curl (Cable)',
  },
  {
    from: 'Baesyan Curl',
    equipment: EquipmentType.DUMBBELL,
    to: 'Baesyan Curl (Dumbbell)',
  },
  {
    from: 'Behind the Back Bicep Wrist Curl',
    equipment: EquipmentType.BARBELL,
    to: 'Behind the Back Bicep Wrist Curl (Barbell)',
  },
  {
    from: 'Behind the Back Bicep Wrist Curl',
    equipment: EquipmentType.CABLE,
    to: 'Behind the Back Bicep Wrist Curl (Cable)',
  },
  {
    from: 'Bench Press',
    equipment: EquipmentType.CABLE,
    to: 'Bench Press (Cable)',
  },
  {
    from: 'Bench Press',
    equipment: EquipmentType.DUMBBELL,
    to: 'Bench Press (Dumbbell)',
  },
  {
    from: 'Bench Press',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Bench Press (Smith Machine)',
  },
  {
    from: 'Bench Press (Decline)',
    equipment: EquipmentType.BARBELL,
    to: 'Bench Press (Decline, Barbell)',
  },
  {
    from: 'Bench Press (Decline)',
    equipment: EquipmentType.DUMBBELL,
    to: 'Bench Press (Decline, Dumbbell)',
  },
  {
    from: 'Bench Press (Decline)',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Bench Press (Decline, Smith Machine)',
  },
  {
    from: 'Bench Press (Incline)',
    equipment: EquipmentType.BARBELL,
    to: 'Bench Press (Incline, Barbell)',
  },
  {
    from: 'Bench Press (Incline)',
    equipment: EquipmentType.DUMBBELL,
    to: 'Bench Press (Incline, Dumbbell)',
  },
  {
    from: 'Bench Press (Incline)',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Bench Press (Incline, Smith Machine)',
  },
  {
    from: 'Bent Over Row',
    equipment: EquipmentType.BAND,
    to: 'Bent Over Row (Band)',
  },
  {
    from: 'Bent Over Row',
    equipment: EquipmentType.BARBELL,
    to: 'Bent Over Row (Barbell)',
  },
  {
    from: 'Bent Over Row',
    equipment: EquipmentType.DUMBBELL,
    to: 'Bent Over Row (Dumbbell)',
  },
  {
    from: 'Bicep Curl',
    equipment: EquipmentType.BAND,
    to: 'Bicep Curl (Band)',
  },
  {
    from: 'Bicep Curl',
    equipment: EquipmentType.BARBELL,
    to: 'Bicep Curl (Barbell)',
  },
  {
    from: 'Bicep Curl',
    equipment: EquipmentType.CABLE,
    to: 'Bicep Curl (Cable)',
  },
  {
    from: 'Bicep Curl',
    equipment: EquipmentType.KETTLEBELL,
    to: 'Bicep Curl (Kettlebell)',
  },
  {
    from: 'Bicep Curl',
    equipment: EquipmentType.MACHINE,
    to: 'Bicep Curl (Machine)',
  },
  {
    from: 'Bicep Curl',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Bicep Curl (Plate Loaded)',
  },
  {
    from: 'Bicep Curl (EZ Bar)',
    equipment: EquipmentType.CABLE,
    to: 'Bicep Curl (EZ Bar, Cable)',
  },
  {
    from: 'Bicep Curl (Incline)',
    equipment: EquipmentType.CABLE,
    to: 'Bicep Curl (Incline, Cable)',
  },
  {
    from: 'Bicep Curl (Incline)',
    equipment: EquipmentType.DUMBBELL,
    to: 'Bicep Curl (Incline, Dumbbell)',
  },
  {
    from: 'Bicep Curl (Standing)',
    equipment: EquipmentType.DUMBBELL,
    to: 'Bicep Curl (Standing, Dumbbell)',
  },
  {
    from: 'Bicep Curl (Standing)',
    equipment: EquipmentType.BARBELL,
    to: 'Bicep Curl (Standing, Barbell)',
  },
  {
    from: 'Box Squat',
    equipment: EquipmentType.BARBELL,
    to: 'Box Squat (Barbell)',
  },
  {
    from: 'Box Squat',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Box Squat (Smith Machine)',
  },
  {
    from: 'Calf Extension',
    equipment: EquipmentType.MACHINE,
    to: 'Calf Extension (Machine)',
  },
  {
    from: 'Calf Extension',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Calf Extension (Plate Loaded)',
  },
  {
    from: 'Calf Press',
    equipment: EquipmentType.MACHINE,
    to: 'Calf Press (Machine)',
  },
  {
    from: 'Calf Press',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Calf Press (Plate Loaded)',
  },
  {
    from: 'Calf Raise',
    equipment: EquipmentType.BARBELL,
    to: 'Calf Raise (Barbell)',
  },
  {
    from: 'Calf Raise',
    equipment: EquipmentType.DUMBBELL,
    to: 'Calf Raise (Dumbbell)',
  },
  {
    from: 'Calf Raise',
    equipment: EquipmentType.MACHINE,
    to: 'Calf Raise (Machine)',
  },
  {
    from: 'Calf Raise',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Calf Raise (Plate Loaded)',
  },
  {
    from: 'Calf Raise',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Calf Raise (Smith Machine)',
  },
  {
    from: 'Calf Raise',
    equipment: EquipmentType.NONE,
    to: 'Calf Raise (Bodyweight)',
  },
  {
    from: 'Calf Raise (Seated)',
    equipment: EquipmentType.MACHINE,
    to: 'Calf Raise (Seated, Machine)',
  },
  {
    from: 'Calf Raise (Seated)',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Calf Raise (Seated, Plate Loaded)',
  },
  { from: 'Chest Fly', equipment: EquipmentType.BAND, to: 'Chest Fly (Band)' },
  {
    from: 'Chest Fly',
    equipment: EquipmentType.CABLE,
    to: 'Chest Fly (Cable)',
  },
  {
    from: 'Chest Fly',
    equipment: EquipmentType.DUMBBELL,
    to: 'Chest Fly (Dumbbell)',
  },
  {
    from: 'Chest Fly',
    equipment: EquipmentType.MACHINE,
    to: 'Chest Fly (Machine)',
  },
  {
    from: 'Chest Fly',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Chest Fly (Plate Loaded)',
  },
  {
    from: 'Chest Press',
    equipment: EquipmentType.BAND,
    to: 'Chest Press (Band)',
  },
  {
    from: 'Chest Press',
    equipment: EquipmentType.MACHINE,
    to: 'Chest Press (Machine)',
  },
  {
    from: 'Chest Press',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Chest Press (Plate Loaded)',
  },
  {
    from: 'Chest Press (Decline)',
    equipment: EquipmentType.MACHINE,
    to: 'Chest Press (Decline, Machine)',
  },
  {
    from: 'Chest Press (Decline)',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Chest Press (Decline, Plate Loaded)',
  },
  {
    from: 'Chest Press (Incline)',
    equipment: EquipmentType.MACHINE,
    to: 'Chest Press (Incline, Machine)',
  },
  {
    from: 'Chest Press (Incline)',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Chest Press (Incline, Plate Loaded)',
  },
  { from: 'Crunch', equipment: EquipmentType.CABLE, to: 'Crunch (Cable)' },
  { from: 'Crunch', equipment: EquipmentType.MACHINE, to: 'Crunch (Machine)' },
  {
    from: 'Crunch',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Crunch (Plate Loaded)',
  },
  { from: 'Crunch', equipment: EquipmentType.NONE, to: 'Crunch (Bodyweight)' },
  {
    from: 'Cycling',
    equipment: EquipmentType.MACHINE,
    to: 'Cycling (Stationary Bike)',
  },
  { from: 'Cycling', equipment: EquipmentType.NONE, to: 'Cycling (Outdoor)' },
  { from: 'Deadlift', equipment: EquipmentType.BAND, to: 'Deadlift (Band)' },
  {
    from: 'Deadlift',
    equipment: EquipmentType.BARBELL,
    to: 'Deadlift (Barbell)',
  },
  {
    from: 'Deadlift',
    equipment: EquipmentType.DUMBBELL,
    to: 'Deadlift (Dumbbell)',
  },
  {
    from: 'Deadlift',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Deadlift (Smith Machine)',
  },
  {
    from: 'Dip (Seated)',
    equipment: EquipmentType.MACHINE,
    to: 'Dip (Seated, Machine)',
  },
  {
    from: 'Dip (Seated)',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Dip (Seated, Plate Loaded)',
  },
  {
    from: 'Farmers Walk',
    equipment: EquipmentType.DUMBBELL,
    to: 'Farmers Walk (Dumbbell)',
  },
  {
    from: 'Farmers Walk',
    equipment: EquipmentType.KETTLEBELL,
    to: 'Farmers Walk (Kettlebell)',
  },
  {
    from: 'Floor Press',
    equipment: EquipmentType.BARBELL,
    to: 'Floor Press (Barbell)',
  },
  {
    from: 'Floor Press',
    equipment: EquipmentType.DUMBBELL,
    to: 'Floor Press (Dumbbell)',
  },
  {
    from: 'Front Lever Hold',
    equipment: EquipmentType.NONE,
    to: 'Front Lever Hold (Bodyweight)',
  },
  {
    from: 'Front Lever Hold',
    equipment: EquipmentType.BAND,
    to: 'Front Lever Hold (Band)',
  },
  {
    from: 'Front Lever Raise',
    equipment: EquipmentType.NONE,
    to: 'Front Lever Raise (Bodyweight)',
  },
  {
    from: 'Front Lever Raise',
    equipment: EquipmentType.BAND,
    to: 'Front Lever Raise (Band)',
  },
  {
    from: 'Front Raise',
    equipment: EquipmentType.BAND,
    to: 'Front Raise (Band)',
  },
  {
    from: 'Front Raise',
    equipment: EquipmentType.BARBELL,
    to: 'Front Raise (Barbell)',
  },
  {
    from: 'Front Raise',
    equipment: EquipmentType.CABLE,
    to: 'Front Raise (Cable)',
  },
  {
    from: 'Front Raise',
    equipment: EquipmentType.DUMBBELL,
    to: 'Front Raise (Dumbbell)',
  },
  {
    from: 'Front Raise',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Front Raise (Plate Loaded)',
  },
  {
    from: 'Glute Kickback',
    equipment: EquipmentType.CABLE,
    to: 'Glute Kickback (Cable)',
  },
  {
    from: 'Glute Kickback',
    equipment: EquipmentType.MACHINE,
    to: 'Glute Kickback (Machine)',
  },
  {
    from: 'Glute Kickback',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Glute Kickback (Plate Loaded)',
  },
  {
    from: 'Hack Squat',
    equipment: EquipmentType.BARBELL,
    to: 'Hack Squat (Barbell)',
  },
  {
    from: 'Hack Squat',
    equipment: EquipmentType.MACHINE,
    to: 'Hack Squat (Machine)',
  },
  {
    from: 'Hack Squat',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Hack Squat (Plate Loaded)',
  },
  {
    from: 'Hammer Curl',
    equipment: EquipmentType.BAND,
    to: 'Hammer Curl (Band)',
  },
  {
    from: 'Hammer Curl',
    equipment: EquipmentType.CABLE,
    to: 'Hammer Curl (Cable)',
  },
  {
    from: 'Hammer Curl',
    equipment: EquipmentType.MACHINE,
    to: 'Hammer Curl (Machine)',
  },
  {
    from: 'Hammer Curl',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Hammer Curl (Plate Loaded)',
  },
  {
    from: 'Hamstring Leg Curl (Lying)',
    equipment: EquipmentType.MACHINE,
    to: 'Hamstring Leg Curl (Lying, Machine)',
  },
  {
    from: 'Hamstring Leg Curl (Lying)',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Hamstring Leg Curl (Lying, Plate Loaded)',
  },
  {
    from: 'Hamstring Leg Curl (Seated)',
    equipment: EquipmentType.MACHINE,
    to: 'Hamstring Leg Curl (Seated, Machine)',
  },
  {
    from: 'Hamstring Leg Curl (Seated)',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Hamstring Leg Curl (Seated, Plate Loaded)',
  },
  {
    from: 'Hamstring Leg Curl (Standing)',
    equipment: EquipmentType.MACHINE,
    to: 'Hamstring Leg Curl (Standing, Machine)',
  },
  {
    from: 'Hamstring Leg Curl (Standing)',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Hamstring Leg Curl (Standing, Plate Loaded)',
  },
  {
    from: 'Hip Abduction',
    equipment: EquipmentType.MACHINE,
    to: 'Hip Abduction (Machine)',
  },
  {
    from: 'Hip Abduction',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Hip Abduction (Plate Loaded)',
  },
  {
    from: 'Hip Adduction',
    equipment: EquipmentType.MACHINE,
    to: 'Hip Adduction (Machine)',
  },
  {
    from: 'Hip Adduction',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Hip Adduction (Plate Loaded)',
  },
  {
    from: 'Hip Thrust',
    equipment: EquipmentType.BARBELL,
    to: 'Hip Thrust (Barbell)',
  },
  {
    from: 'Hip Thrust',
    equipment: EquipmentType.MACHINE,
    to: 'Hip Thrust (Machine)',
  },
  {
    from: 'Hip Thrust',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Hip Thrust (Plate Loaded)',
  },
  {
    from: 'Hip Thrust',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Hip Thrust (Smith Machine)',
  },
  {
    from: 'Hip Thrust',
    equipment: EquipmentType.NONE,
    to: 'Hip Thrust (Bodyweight)',
  },
  {
    from: 'Iso-Lateral Row',
    equipment: EquipmentType.MACHINE,
    to: 'Iso-Lateral Row (Machine)',
  },
  {
    from: 'Iso-Lateral Row',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Iso-Lateral Row (Plate Loaded)',
  },
  {
    from: 'Kneeling Pulldown',
    equipment: EquipmentType.BAND,
    to: 'Kneeling Pulldown (Band)',
  },
  {
    from: 'Kneeling Pulldown',
    equipment: EquipmentType.CABLE,
    to: 'Kneeling Pulldown (Cable)',
  },
  {
    from: 'Lat Pulldown',
    equipment: EquipmentType.BAND,
    to: 'Lat Pulldown (Band)',
  },
  {
    from: 'Lat Pulldown',
    equipment: EquipmentType.CABLE,
    to: 'Lat Pulldown (Cable)',
  },
  {
    from: 'Lat Pulldown',
    equipment: EquipmentType.MACHINE,
    to: 'Lat Pulldown (Machine)',
  },
  {
    from: 'Lat Pulldown',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Lat Pulldown (Plate Loaded)',
  },
  {
    from: 'Lat Pullover',
    equipment: EquipmentType.DUMBBELL,
    to: 'Lat Pullover (Dumbbell)',
  },
  {
    from: 'Lat Pullover',
    equipment: EquipmentType.MACHINE,
    to: 'Lat Pullover (Machine)',
  },
  {
    from: 'Lat Pullover',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Lat Pullover (Plate Loaded)',
  },
  {
    from: 'Lateral Raise (Seated)',
    equipment: EquipmentType.DUMBBELL,
    to: 'Lateral Raise (Seated, Dumbbell)',
  },
  {
    from: 'Lateral Raise (Seated)',
    equipment: EquipmentType.MACHINE,
    to: 'Lateral Raise (Seated, Machine)',
  },
  {
    from: 'Lateral Raise (Standing)',
    equipment: EquipmentType.DUMBBELL,
    to: 'Lateral Raise (Standing, Dumbbell)',
  },
  {
    from: 'Lateral Raise (Standing)',
    equipment: EquipmentType.MACHINE,
    to: 'Lateral Raise (Standing, Machine)',
  },
  {
    from: 'Leg Press',
    equipment: EquipmentType.MACHINE,
    to: 'Leg Press (Machine)',
  },
  {
    from: 'Leg Press',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Leg Press (Plate Loaded)',
  },
  {
    from: 'Leg Press Horizontal',
    equipment: EquipmentType.MACHINE,
    to: 'Leg Press Horizontal (Machine)',
  },
  {
    from: 'Leg Press Horizontal',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Leg Press Horizontal (Plate Loaded)',
  },
  { from: 'Lunge', equipment: EquipmentType.BARBELL, to: 'Lunge (Barbell)' },
  { from: 'Lunge', equipment: EquipmentType.DUMBBELL, to: 'Lunge (Dumbbell)' },
  {
    from: 'Overhead Press',
    equipment: EquipmentType.BARBELL,
    to: 'Overhead Press (Barbell)',
  },
  {
    from: 'Overhead Press',
    equipment: EquipmentType.CABLE,
    to: 'Overhead Press (Cable)',
  },
  {
    from: 'Overhead Press',
    equipment: EquipmentType.DUMBBELL,
    to: 'Overhead Press (Dumbbell)',
  },
  {
    from: 'Overhead Press',
    equipment: EquipmentType.KETTLEBELL,
    to: 'Overhead Press (Kettlebell)',
  },
  {
    from: 'Overhead Press',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Overhead Press (Smith Machine)',
  },
  {
    from: 'Overhead Tricep Extension (Seated)',
    equipment: EquipmentType.BARBELL,
    to: 'Overhead Tricep Extension (Seated, Barbell)',
  },
  {
    from: 'Overhead Tricep Extension (Seated)',
    equipment: EquipmentType.DUMBBELL,
    to: 'Overhead Tricep Extension (Seated, Dumbbell)',
  },
  {
    from: 'Overhead Tricep Extension (Standing)',
    equipment: EquipmentType.BARBELL,
    to: 'Overhead Tricep Extension (Standing, Barbell)',
  },
  {
    from: 'Overhead Tricep Extension (Standing)',
    equipment: EquipmentType.DUMBBELL,
    to: 'Overhead Tricep Extension (Standing, Dumbbell)',
  },
  {
    from: 'Palms Up Wrist Curl',
    equipment: EquipmentType.BARBELL,
    to: 'Palms Up Wrist Curl (Barbell)',
  },
  {
    from: 'Palms Up Wrist Curl',
    equipment: EquipmentType.DUMBBELL,
    to: 'Palms Up Wrist Curl (Dumbbell)',
  },
  {
    from: 'Preacher Curl',
    equipment: EquipmentType.BARBELL,
    to: 'Preacher Curl (Barbell)',
  },
  {
    from: 'Preacher Curl',
    equipment: EquipmentType.DUMBBELL,
    to: 'Preacher Curl (Dumbbell)',
  },
  {
    from: 'Preacher Curl',
    equipment: EquipmentType.MACHINE,
    to: 'Preacher Curl (Machine)',
  },
  {
    from: 'Preacher Curl',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Preacher Curl (Plate Loaded)',
  },
  {
    from: 'Pull Up (Assisted)',
    equipment: EquipmentType.BAND,
    to: 'Pull Up (Assisted, Band)',
  },
  {
    from: 'Pull Up (Assisted)',
    equipment: EquipmentType.MACHINE,
    to: 'Pull Up (Assisted, Machine)',
  },
  {
    from: 'Quad Leg Extension',
    equipment: EquipmentType.MACHINE,
    to: 'Quad Leg Extension (Machine)',
  },
  {
    from: 'Quad Leg Extension',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Quad Leg Extension (Plate Loaded)',
  },
  {
    from: 'Rear Delt Reverse Fly',
    equipment: EquipmentType.CABLE,
    to: 'Rear Delt Reverse Fly (Cable)',
  },
  {
    from: 'Rear Delt Reverse Fly',
    equipment: EquipmentType.DUMBBELL,
    to: 'Rear Delt Reverse Fly (Dumbbell)',
  },
  {
    from: 'Rear Delt Reverse Fly',
    equipment: EquipmentType.MACHINE,
    to: 'Rear Delt Reverse Fly (Machine)',
  },
  {
    from: 'Rear Delt Reverse Fly',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Rear Delt Reverse Fly (Plate Loaded)',
  },
  {
    from: 'Reverse Crunch',
    equipment: EquipmentType.CABLE,
    to: 'Reverse Crunch (Cable)',
  },
  {
    from: 'Reverse Crunch',
    equipment: EquipmentType.NONE,
    to: 'Reverse Crunch (Bodyweight)',
  },
  {
    from: 'Reverse Curl',
    equipment: EquipmentType.BAND,
    to: 'Reverse Curl (Band)',
  },
  {
    from: 'Reverse Curl',
    equipment: EquipmentType.BARBELL,
    to: 'Reverse Curl (Barbell)',
  },
  {
    from: 'Reverse Curl',
    equipment: EquipmentType.CABLE,
    to: 'Reverse Curl (Cable)',
  },
  {
    from: 'Reverse Curl',
    equipment: EquipmentType.DUMBBELL,
    to: 'Reverse Curl (Dumbbell)',
  },
  {
    from: 'Reverse Curl',
    equipment: EquipmentType.KETTLEBELL,
    to: 'Reverse Curl (Kettlebell)',
  },
  {
    from: 'Reverse Curl',
    equipment: EquipmentType.MACHINE,
    to: 'Reverse Curl (Machine)',
  },
  {
    from: 'Reverse Curl',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Reverse Curl (Plate Loaded)',
  },
  {
    from: 'Reverse Curl (EZ Bar)',
    equipment: EquipmentType.CABLE,
    to: 'Reverse Curl (EZ Bar, Cable)',
  },
  {
    from: 'Reverse Hyperextension',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Reverse Hyperextension (Plate Loaded)',
  },
  {
    from: 'Reverse Hyperextension',
    equipment: EquipmentType.NONE,
    to: 'Reverse Hyperextension (Bodyweight)',
  },
  {
    from: 'Reverse Lunge',
    equipment: EquipmentType.BARBELL,
    to: 'Reverse Lunge (Barbell)',
  },
  {
    from: 'Reverse Lunge',
    equipment: EquipmentType.NONE,
    to: 'Reverse Lunge (Bodyweight)',
  },
  {
    from: 'Romanian Deadlift',
    equipment: EquipmentType.BARBELL,
    to: 'Romanian Deadlift (Barbell)',
  },
  {
    from: 'Romanian Deadlift',
    equipment: EquipmentType.DUMBBELL,
    to: 'Romanian Deadlift (Dumbbell)',
  },
  {
    from: 'Shoulder Press',
    equipment: EquipmentType.BARBELL,
    to: 'Shoulder Press (Barbell)',
  },
  {
    from: 'Shoulder Press',
    equipment: EquipmentType.DUMBBELL,
    to: 'Shoulder Press (Dumbbell)',
  },
  {
    from: 'Shoulder Press',
    equipment: EquipmentType.KETTLEBELL,
    to: 'Shoulder Press (Kettlebell)',
  },
  {
    from: 'Shoulder Press',
    equipment: EquipmentType.MACHINE,
    to: 'Shoulder Press (Machine)',
  },
  {
    from: 'Shoulder Press',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Shoulder Press (Plate Loaded)',
  },
  { from: 'Shrug', equipment: EquipmentType.BARBELL, to: 'Shrug (Barbell)' },
  { from: 'Shrug', equipment: EquipmentType.CABLE, to: 'Shrug (Cable)' },
  { from: 'Shrug', equipment: EquipmentType.DUMBBELL, to: 'Shrug (Dumbbell)' },
  { from: 'Shrug', equipment: EquipmentType.MACHINE, to: 'Shrug (Machine)' },
  {
    from: 'Shrug',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Shrug (Plate Loaded)',
  },
  {
    from: 'Shrug',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Shrug (Smith Machine)',
  },
  {
    from: 'Side Bend',
    equipment: EquipmentType.DUMBBELL,
    to: 'Side Bend (Dumbbell)',
  },
  {
    from: 'Side Bend',
    equipment: EquipmentType.NONE,
    to: 'Side Bend (Bodyweight)',
  },
  {
    from: 'Skullcrusher',
    equipment: EquipmentType.BARBELL,
    to: 'Skullcrusher (Barbell)',
  },
  {
    from: 'Skullcrusher',
    equipment: EquipmentType.DUMBBELL,
    to: 'Skullcrusher (Dumbbell)',
  },
  {
    from: 'Spider Curl',
    equipment: EquipmentType.BAND,
    to: 'Spider Curl (Band)',
  },
  {
    from: 'Spider Curl',
    equipment: EquipmentType.BARBELL,
    to: 'Spider Curl (Barbell)',
  },
  {
    from: 'Spider Curl',
    equipment: EquipmentType.DUMBBELL,
    to: 'Spider Curl (Dumbbell)',
  },
  {
    from: 'Spider Curl',
    equipment: EquipmentType.KETTLEBELL,
    to: 'Spider Curl (Kettlebell)',
  },
  { from: 'Squat', equipment: EquipmentType.BAND, to: 'Squat (Band)' },
  { from: 'Squat', equipment: EquipmentType.BARBELL, to: 'Squat (Barbell)' },
  { from: 'Squat', equipment: EquipmentType.DUMBBELL, to: 'Squat (Dumbbell)' },
  { from: 'Squat', equipment: EquipmentType.MACHINE, to: 'Squat (Machine)' },
  {
    from: 'Squat',
    equipment: EquipmentType.PLATE_LOADED,
    to: 'Squat (Plate Loaded)',
  },
  {
    from: 'Squat',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Squat (Smith Machine)',
  },
  { from: 'Squat', equipment: EquipmentType.NONE, to: 'Squat (Bodyweight)' },
  {
    from: 'Sumo Squat',
    equipment: EquipmentType.BARBELL,
    to: 'Sumo Squat (Barbell)',
  },
  {
    from: 'Sumo Squat',
    equipment: EquipmentType.DUMBBELL,
    to: 'Sumo Squat (Dumbbell)',
  },
  {
    from: 'Sumo Squat',
    equipment: EquipmentType.KETTLEBELL,
    to: 'Sumo Squat (Kettlebell)',
  },
  {
    from: 'Sumo Squat',
    equipment: EquipmentType.NONE,
    to: 'Sumo Squat (Bodyweight)',
  },
  {
    from: 'Triceps Kickback',
    equipment: EquipmentType.CABLE,
    to: 'Triceps Kickback (Cable)',
  },
  {
    from: 'Triceps Kickback',
    equipment: EquipmentType.DUMBBELL,
    to: 'Triceps Kickback (Dumbbell)',
  },
  {
    from: 'Upright Row',
    equipment: EquipmentType.BARBELL,
    to: 'Upright Row (Barbell)',
  },
  {
    from: 'Upright Row',
    equipment: EquipmentType.CABLE,
    to: 'Upright Row (Cable)',
  },
  {
    from: 'Upright Row',
    equipment: EquipmentType.DUMBBELL,
    to: 'Upright Row (Dumbbell)',
  },
  {
    from: 'Upright Row',
    equipment: EquipmentType.SMITH_MACHINE,
    to: 'Upright Row (Smith Machine)',
  },
  {
    from: 'Walking Lunge',
    equipment: EquipmentType.DUMBBELL,
    to: 'Walking Lunge (Dumbbell)',
  },
  {
    from: 'Walking Lunge',
    equipment: EquipmentType.NONE,
    to: 'Walking Lunge (Bodyweight)',
  },
];

/**
 * Renames the row of a legacy shared name to its variant name, picking the
 * variant from the row's own equipment_type: the seed copied every field of
 * the surviving variant, so the equipment tells which variant the row is. The
 * row keeps its id, so the workouts, stats and badges that reference it stay
 * attached. Idempotent, and a target name that already exists (for instance a
 * user-created exercise) is left alone. Returns the renamed names.
 */
export async function renameLegacyVariants(
  runner: SqlRunner,
): Promise<string[]> {
  const rows = await runner.query(
    `UPDATE exercises e
        SET name = r.to_name
       FROM unnest($1::text[], $2::text[], $3::text[]) AS r(from_name, equipment, to_name)
      WHERE e.name = r.from_name
        AND e.equipment_type::text = r.equipment
        AND NOT EXISTS (SELECT 1 FROM exercises x WHERE x.name = r.to_name)
  RETURNING e.name`,
    [
      VARIANT_RENAMES_2026_10.map((r) => r.from),
      VARIANT_RENAMES_2026_10.map((r) => r.equipment),
      VARIANT_RENAMES_2026_10.map((r) => r.to),
    ],
  );

  // Postgres returns [rows, count] for an UPDATE ... RETURNING through TypeORM.
  const list = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;

  return (list as Array<{ name: string }>).map((r) => r.name);
}
