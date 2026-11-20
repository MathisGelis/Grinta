import { MigrationInterface, QueryRunner } from 'typeorm';

// Schema of the `backend` branch before any migration existed, as
// `migration:generate` produces it on an empty database from those entities.
// It is what production was built with by `synchronize`, so every statement
// is made conditional: on production it changes nothing, on an empty database
// (a new environment, a developer's machine) it creates the base schema the
// later migrations build on. This is what allows running without
// `synchronize`: the schema is entirely described by migrations.
const EXTENSIONS = [
  // uuid_generate_v4() for the primary keys.
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
  // similarity() for the user search.
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
];

const UP: string[] = [
  `CREATE TABLE IF NOT EXISTS "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "displayName" character varying NOT NULL, "uniqueName" character varying NOT NULL, "isPublic" boolean NOT NULL DEFAULT true, "birthDate" date, "height" double precision, "weight" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_877c7558e6b1412aa6e8e8c2507" UNIQUE ("uniqueName"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "user_exercise_stats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "PR" double precision, "last_reps" double precision, "last_weight" double precision, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "exercise_id" uuid, CONSTRAINT "UQ_6d9ae73cdbfc49bc9153f7643e1" UNIQUE ("user_id", "exercise_id"), CONSTRAINT "PK_012396222a99d3cc7e99e689485" PRIMARY KEY ("id"))`,
  `DO $$ BEGIN CREATE TYPE "public"."exercises_equipment_type_enum" AS ENUM('barbell', 'dumbbell', 'machine', 'plate_loaded', 'smith_machine', 'cable', 'kettlebell', 'band', 'none'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "public"."exercises_primary_muscle_enum" AS ENUM('biceps', 'triceps', 'forearms', 'front_delts', 'side_delts', 'rear_delts', 'upper_chest', 'middle_chest', 'lower_chest', 'lats', 'rhomboids', 'traps', 'lower_back', 'upper_abs', 'lower_abs', 'obliques', 'glutes', 'hip_flexors', 'abductors', 'adductors', 'quads', 'hamstrings', 'calves', 'neck', 'full_body', 'cardio'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "public"."exercises_secondary_muscles_enum" AS ENUM('biceps', 'triceps', 'forearms', 'front_delts', 'side_delts', 'rear_delts', 'upper_chest', 'middle_chest', 'lower_chest', 'lats', 'rhomboids', 'traps', 'lower_back', 'upper_abs', 'lower_abs', 'obliques', 'glutes', 'hip_flexors', 'abductors', 'adductors', 'quads', 'hamstrings', 'calves', 'neck', 'full_body', 'cardio'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "public"."exercises_exercise_type_enum" AS ENUM('weight_reps', 'bodyweight_reps', 'weighted_bodyweight', 'assisted_bodyweight', 'duration', 'duration_weight', 'distance_duration', 'weight_distance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "equipment_type" "public"."exercises_equipment_type_enum" NOT NULL, "primary_muscle" "public"."exercises_primary_muscle_enum" NOT NULL, "secondary_muscles" "public"."exercises_secondary_muscles_enum" array, "exercise_type" "public"."exercises_exercise_type_enum" NOT NULL, "image_url" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a521b5cac5648eedc036e17d1bd" UNIQUE ("name"), CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "IDX_8995fbbb3fa7e096078f060712" ON "exercises" ("primary_muscle")`,
  `CREATE INDEX IF NOT EXISTS "IDX_53c1e08e8dc2e47192a1791186" ON "exercises" ("equipment_type")`,
  `CREATE INDEX IF NOT EXISTS "IDX_a521b5cac5648eedc036e17d1b" ON "exercises" ("name")`,
  `CREATE TABLE IF NOT EXISTS "planned_workouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_49a7c591ef03d94850f31a827d9" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "planned_workout_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sets" jsonb, "plannedRestSeconds" integer, "workoutId" uuid, "exerciseId" uuid, CONSTRAINT "PK_7820dfb2a6195feda08e2558b6f" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "completed_workouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "completionDate" TIMESTAMP NOT NULL, "totalDurationSeconds" integer NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_ab247931c68ee1811830af9f8f1" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "completed_workout_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sets" jsonb, "timerSeconds" integer, "workoutId" uuid, "exerciseId" uuid, CONSTRAINT "PK_bf690b1a359c944e79c75d51c1c" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "programme_days" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "dayNumber" integer NOT NULL, "programmeId" uuid, "workoutId" uuid, CONSTRAINT "PK_15a87b966f5bb11a9a502e03316" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_3ca2ba2c38c2d1f756c86cc332" ON "programme_days" ("programmeId", "dayNumber")`,
  `DO $$ BEGIN CREATE TYPE "public"."programmes_difficulty_enum" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "public"."programmes_locationtype_enum" AS ENUM('GYM', 'HOME', 'OUTDOORS', 'ANY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "programmes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "weekNumber" integer NOT NULL, "difficulty" "public"."programmes_difficulty_enum" NOT NULL, "locationType" "public"."programmes_locationtype_enum" NOT NULL, "title" character varying NOT NULL, "description" text, "userId" uuid, CONSTRAINT "PK_116b5f8dbb9f632d76bc144404f" PRIMARY KEY ("id"))`,
  `DO $$ BEGIN CREATE TYPE "public"."comment_reports_reason_enum" AS ENUM('spam', 'harassment', 'hate_speech', 'inappropriate', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "comment_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reason" "public"."comment_reports_reason_enum" NOT NULL DEFAULT 'other', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "reporterId" uuid NOT NULL, "commentId" uuid NOT NULL, CONSTRAINT "UQ_8b6189e965af7031f41de7c8492" UNIQUE ("reporterId", "commentId"), CONSTRAINT "PK_61b98c6ce36db288146bba85d29" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "post_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "reportCount" integer NOT NULL DEFAULT '0', "isHidden" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "postId" uuid, CONSTRAINT "PK_2e99e04b4a1b31de6f833c18ced" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "post_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "postId" uuid, CONSTRAINT "UQ_30ee85070afe5b92b5920957b1c" UNIQUE ("userId", "postId"), CONSTRAINT "PK_e4ac7cb9daf243939c6eabb2e0d" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "workoutId" uuid, CONSTRAINT "REL_f17e290533197b43733531f518" UNIQUE ("workoutId"), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "follow_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "followerId" uuid NOT NULL, "followingId" uuid NOT NULL, CONSTRAINT "UQ_3fc2efc9367b0a0c42c16703ad4" UNIQUE ("followerId", "followingId"), CONSTRAINT "PK_e3bb7b01985276e9bce698b81bc" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "followerId" uuid, "followingId" uuid, CONSTRAINT "UQ_42819b4b272b654d1db736672dc" UNIQUE ("followerId", "followingId"), CONSTRAINT "PK_0a1f844af3122354cbd487a8d03" PRIMARY KEY ("id"))`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_b0b8188a25f4d73f3e2ad6897d5') THEN ALTER TABLE "user_exercise_stats" ADD CONSTRAINT "FK_b0b8188a25f4d73f3e2ad6897d5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_f550f5f10d673169561a31f275b') THEN ALTER TABLE "user_exercise_stats" ADD CONSTRAINT "FK_f550f5f10d673169561a31f275b" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_97e2d639d35b473b35afb3a718e') THEN ALTER TABLE "planned_workouts" ADD CONSTRAINT "FK_97e2d639d35b473b35afb3a718e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_071b923cb0128df36425e92ebe4') THEN ALTER TABLE "planned_workout_exercises" ADD CONSTRAINT "FK_071b923cb0128df36425e92ebe4" FOREIGN KEY ("workoutId") REFERENCES "planned_workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ff79113873606066a44d243eba0') THEN ALTER TABLE "planned_workout_exercises" ADD CONSTRAINT "FK_ff79113873606066a44d243eba0" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_f24f699f1b529f9e9a39b55cf80') THEN ALTER TABLE "completed_workouts" ADD CONSTRAINT "FK_f24f699f1b529f9e9a39b55cf80" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_3475b05cfc296544d32c8febe9b') THEN ALTER TABLE "completed_workout_exercises" ADD CONSTRAINT "FK_3475b05cfc296544d32c8febe9b" FOREIGN KEY ("workoutId") REFERENCES "completed_workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_a4272fdfbd3f46485ac546deae8') THEN ALTER TABLE "completed_workout_exercises" ADD CONSTRAINT "FK_a4272fdfbd3f46485ac546deae8" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_15285953286d715c83a7a45cdc1') THEN ALTER TABLE "programme_days" ADD CONSTRAINT "FK_15285953286d715c83a7a45cdc1" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_709330aabd82d59ceaf7f469878') THEN ALTER TABLE "programme_days" ADD CONSTRAINT "FK_709330aabd82d59ceaf7f469878" FOREIGN KEY ("workoutId") REFERENCES "planned_workouts"("id") ON DELETE SET NULL ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_5174e1e4e21cdeeeec361fab2fd') THEN ALTER TABLE "programmes" ADD CONSTRAINT "FK_5174e1e4e21cdeeeec361fab2fd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_36ab772754faebab9c812565988') THEN ALTER TABLE "comment_reports" ADD CONSTRAINT "FK_36ab772754faebab9c812565988" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_14ce729bcc2ec2f7c16b11b2d9e') THEN ALTER TABLE "comment_reports" ADD CONSTRAINT "FK_14ce729bcc2ec2f7c16b11b2d9e" FOREIGN KEY ("commentId") REFERENCES "post_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_62817b3571ec31e552a3cae4e1c') THEN ALTER TABLE "post_comments" ADD CONSTRAINT "FK_62817b3571ec31e552a3cae4e1c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ac65d744abc05279aee0b290857') THEN ALTER TABLE "post_comments" ADD CONSTRAINT "FK_ac65d744abc05279aee0b290857" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_37d337ad54b1aa6b9a44415a498') THEN ALTER TABLE "post_likes" ADD CONSTRAINT "FK_37d337ad54b1aa6b9a44415a498" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_6999d13aca25e33515210abaf16') THEN ALTER TABLE "post_likes" ADD CONSTRAINT "FK_6999d13aca25e33515210abaf16" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ae05faaa55c866130abef6e1fee') THEN ALTER TABLE "posts" ADD CONSTRAINT "FK_ae05faaa55c866130abef6e1fee" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_f17e290533197b43733531f518c') THEN ALTER TABLE "posts" ADD CONSTRAINT "FK_f17e290533197b43733531f518c" FOREIGN KEY ("workoutId") REFERENCES "completed_workouts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_dd340692c39b59049ffaec7ca81') THEN ALTER TABLE "follow_requests" ADD CONSTRAINT "FK_dd340692c39b59049ffaec7ca81" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_d5ad5418e97d5f6bd5bce266a09') THEN ALTER TABLE "follow_requests" ADD CONSTRAINT "FK_d5ad5418e97d5f6bd5bce266a09" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_ac4468b7105ca62762843ed8571') THEN ALTER TABLE "connections" ADD CONSTRAINT "FK_ac4468b7105ca62762843ed8571" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_198bc4033288b26df875510ddce') THEN ALTER TABLE "connections" ADD CONSTRAINT "FK_198bc4033288b26df875510ddce" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION; END IF; END $$`,
];

const DOWN: string[] = [
  `ALTER TABLE IF EXISTS "connections" DROP CONSTRAINT IF EXISTS "FK_198bc4033288b26df875510ddce"`,
  `ALTER TABLE IF EXISTS "connections" DROP CONSTRAINT IF EXISTS "FK_ac4468b7105ca62762843ed8571"`,
  `ALTER TABLE IF EXISTS "follow_requests" DROP CONSTRAINT IF EXISTS "FK_d5ad5418e97d5f6bd5bce266a09"`,
  `ALTER TABLE IF EXISTS "follow_requests" DROP CONSTRAINT IF EXISTS "FK_dd340692c39b59049ffaec7ca81"`,
  `ALTER TABLE IF EXISTS "posts" DROP CONSTRAINT IF EXISTS "FK_f17e290533197b43733531f518c"`,
  `ALTER TABLE IF EXISTS "posts" DROP CONSTRAINT IF EXISTS "FK_ae05faaa55c866130abef6e1fee"`,
  `ALTER TABLE IF EXISTS "post_likes" DROP CONSTRAINT IF EXISTS "FK_6999d13aca25e33515210abaf16"`,
  `ALTER TABLE IF EXISTS "post_likes" DROP CONSTRAINT IF EXISTS "FK_37d337ad54b1aa6b9a44415a498"`,
  `ALTER TABLE IF EXISTS "post_comments" DROP CONSTRAINT IF EXISTS "FK_ac65d744abc05279aee0b290857"`,
  `ALTER TABLE IF EXISTS "post_comments" DROP CONSTRAINT IF EXISTS "FK_62817b3571ec31e552a3cae4e1c"`,
  `ALTER TABLE IF EXISTS "comment_reports" DROP CONSTRAINT IF EXISTS "FK_14ce729bcc2ec2f7c16b11b2d9e"`,
  `ALTER TABLE IF EXISTS "comment_reports" DROP CONSTRAINT IF EXISTS "FK_36ab772754faebab9c812565988"`,
  `ALTER TABLE IF EXISTS "programmes" DROP CONSTRAINT IF EXISTS "FK_5174e1e4e21cdeeeec361fab2fd"`,
  `ALTER TABLE IF EXISTS "programme_days" DROP CONSTRAINT IF EXISTS "FK_709330aabd82d59ceaf7f469878"`,
  `ALTER TABLE IF EXISTS "programme_days" DROP CONSTRAINT IF EXISTS "FK_15285953286d715c83a7a45cdc1"`,
  `ALTER TABLE IF EXISTS "completed_workout_exercises" DROP CONSTRAINT IF EXISTS "FK_a4272fdfbd3f46485ac546deae8"`,
  `ALTER TABLE IF EXISTS "completed_workout_exercises" DROP CONSTRAINT IF EXISTS "FK_3475b05cfc296544d32c8febe9b"`,
  `ALTER TABLE IF EXISTS "completed_workouts" DROP CONSTRAINT IF EXISTS "FK_f24f699f1b529f9e9a39b55cf80"`,
  `ALTER TABLE IF EXISTS "planned_workout_exercises" DROP CONSTRAINT IF EXISTS "FK_ff79113873606066a44d243eba0"`,
  `ALTER TABLE IF EXISTS "planned_workout_exercises" DROP CONSTRAINT IF EXISTS "FK_071b923cb0128df36425e92ebe4"`,
  `ALTER TABLE IF EXISTS "planned_workouts" DROP CONSTRAINT IF EXISTS "FK_97e2d639d35b473b35afb3a718e"`,
  `ALTER TABLE IF EXISTS "user_exercise_stats" DROP CONSTRAINT IF EXISTS "FK_f550f5f10d673169561a31f275b"`,
  `ALTER TABLE IF EXISTS "user_exercise_stats" DROP CONSTRAINT IF EXISTS "FK_b0b8188a25f4d73f3e2ad6897d5"`,
  `DROP TABLE IF EXISTS "connections"`,
  `DROP TABLE IF EXISTS "follow_requests"`,
  `DROP TABLE IF EXISTS "posts"`,
  `DROP TABLE IF EXISTS "post_likes"`,
  `DROP TABLE IF EXISTS "post_comments"`,
  `DROP TABLE IF EXISTS "comment_reports"`,
  `DROP TYPE IF EXISTS "public"."comment_reports_reason_enum"`,
  `DROP TABLE IF EXISTS "programmes"`,
  `DROP TYPE IF EXISTS "public"."programmes_locationtype_enum"`,
  `DROP TYPE IF EXISTS "public"."programmes_difficulty_enum"`,
  `DROP INDEX IF EXISTS "public"."IDX_3ca2ba2c38c2d1f756c86cc332"`,
  `DROP TABLE IF EXISTS "programme_days"`,
  `DROP TABLE IF EXISTS "completed_workout_exercises"`,
  `DROP TABLE IF EXISTS "completed_workouts"`,
  `DROP TABLE IF EXISTS "planned_workout_exercises"`,
  `DROP TABLE IF EXISTS "planned_workouts"`,
  `DROP INDEX IF EXISTS "public"."IDX_a521b5cac5648eedc036e17d1b"`,
  `DROP INDEX IF EXISTS "public"."IDX_53c1e08e8dc2e47192a1791186"`,
  `DROP INDEX IF EXISTS "public"."IDX_8995fbbb3fa7e096078f060712"`,
  `DROP TABLE IF EXISTS "exercises"`,
  `DROP TYPE IF EXISTS "public"."exercises_exercise_type_enum"`,
  `DROP TYPE IF EXISTS "public"."exercises_secondary_muscles_enum"`,
  `DROP TYPE IF EXISTS "public"."exercises_primary_muscle_enum"`,
  `DROP TYPE IF EXISTS "public"."exercises_equipment_type_enum"`,
  `DROP TABLE IF EXISTS "user_exercise_stats"`,
  `DROP TABLE IF EXISTS "users"`,
];

export class InitialSchema1790000000000 implements MigrationInterface {
  name = 'InitialSchema1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const statement of [...EXTENSIONS, ...UP])
      await queryRunner.query(statement);
  }

  // Reverting the baseline drops every table and its data. It only makes
  // sense on a scratch database, so it has to be asked for explicitly.
  public async down(queryRunner: QueryRunner): Promise<void> {
    if (process.env.ALLOW_BASELINE_REVERT !== 'true')
      throw new Error(
        'Reverting InitialSchema drops every table. Set ALLOW_BASELINE_REVERT=true to do it on purpose.',
      );
    for (const statement of DOWN) await queryRunner.query(statement);
  }
}
