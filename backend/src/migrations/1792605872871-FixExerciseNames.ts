import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  fixExerciseNames,
  NAME_FIXES_2026_10,
} from '../exercise/seed/name-fixes';

// "Baesyan Curl" was a misspelling of Bayesian Curl. Renames the rows in
// place, so their ids and everything that references them survive. The seed
// applies the same fix before upserting, so running it first is safe too.
// down() puts the old names back, the same way.
export class FixExerciseNames1792605872871 implements MigrationInterface {
  name = 'FixExerciseNames1792605872871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await fixExerciseNames(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await fixExerciseNames(
      queryRunner,
      NAME_FIXES_2026_10.map(({ from, to }) => ({ from: to, to: from })),
    );
  }
}
