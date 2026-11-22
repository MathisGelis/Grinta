import { MigrationInterface, QueryRunner } from 'typeorm';
import { AddForeignKeyIndexes1790935338305 } from './1790935338305-AddForeignKeyIndexes';
import { AddExerciseStatsAndBadges1792605872857 } from './1792605872857-AddExerciseStatsAndBadges';
import { AddExerciseContent1792605872858 } from './1792605872858-AddExerciseContent';
import { AddPhotos1792605872860 } from './1792605872860-AddPhotos';
import { AddPhotoThumbnails1792605872861 } from './1792605872861-AddPhotoThumbnails';
import { AddPostCounters1792605872862 } from './1792605872862-AddPostCounters';
import { AddAvatarThumbnails1792605872863 } from './1792605872863-AddAvatarThumbnails';
import { AddPostPartners1792605872864 } from './1792605872864-AddPostPartners';

// Production had every migration recorded in the migrations table while
// columns they add were missing (exercises content, photos, post counters,
// exercise stats), and some went missing again after being restored. TypeORM
// never runs a recorded migration twice, so this one runs the schema changes
// of all of them once more. Each is idempotent (IF NOT EXISTS, constraints
// guarded), so whatever is already there is left as it is, and the post
// counters are recounted. Left out: InitialSchema, whose tables production
// has, and RenameExerciseVariants, which changes data, not the schema.
// `npm run schema:check:prod` then confirms nothing is missing.
const REPAIRED: MigrationInterface[] = [
  new AddForeignKeyIndexes1790935338305(),
  new AddExerciseStatsAndBadges1792605872857(),
  new AddExerciseContent1792605872858(),
  new AddPhotos1792605872860(),
  new AddPhotoThumbnails1792605872861(),
  new AddPostCounters1792605872862(),
  new AddAvatarThumbnails1792605872863(),
  new AddPostPartners1792605872864(),
];

export class RepairSchemaDrift1792605872865 implements MigrationInterface {
  name = 'RepairSchemaDrift1792605872865';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const migration of REPAIRED) await migration.up(queryRunner);
  }

  // Nothing to undo: up() only restores what the migrations above already
  // own, and their down() is what removes it. Reverting this one must not
  // drop columns that the earlier, still recorded, migrations created.
  public async down(): Promise<void> {}
}
