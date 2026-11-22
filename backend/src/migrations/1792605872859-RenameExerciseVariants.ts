import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  renameLegacyVariants,
  VARIANT_RENAMES_2026_10,
} from '../exercise/seed/variant-renames';

// Every variant of the exercise catalogue now carries its equipment in its
// name (see variant-renames.ts). Renames the existing rows in place, so their
// ids and everything that references them survive; the seed then creates the
// variants that never reached the database. The seed applies the same rename
// before upserting, so running it first is safe too.
export class RenameExerciseVariants1792605872859 implements MigrationInterface {
  name = 'RenameExerciseVariants1792605872859';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await renameLegacyVariants(queryRunner);
  }

  // Gives each old name back to the oldest row among its variants, which is
  // the row that held it before up(). The other variants keep their new name,
  // since the old catalogue only had room for one row per name, and an old
  // name taken again in between is left alone: once seeded, Bicep Curl (EZ
  // Bar) is the barbell variant and the cable row keeps its new name.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE exercises e
          SET name = r.from_name
         FROM (
           SELECT DISTINCT ON (m.from_name) m.from_name, x.id
             FROM unnest($1::text[], $2::text[]) AS m(from_name, to_name)
             JOIN exercises x ON x.name = m.to_name
            ORDER BY m.from_name, x."createdAt", x.id
         ) r
        WHERE e.id = r.id
          AND NOT EXISTS (SELECT 1 FROM exercises y WHERE y.name = r.from_name)`,
      [
        VARIANT_RENAMES_2026_10.map((r) => r.from),
        VARIANT_RENAMES_2026_10.map((r) => r.to),
      ],
    );
  }
}
