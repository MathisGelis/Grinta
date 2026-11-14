import { DataSource } from 'typeorm';
import { Exercise } from '../entities/exercise.entity';
import * as fs from 'fs';
import * as path from 'path';
import { renameLegacyVariants } from './variant-renames';

export async function seedExercises(dataSource: DataSource) {
  const repo = dataSource.getRepository(Exercise);

  const filePath = path.join(__dirname, '../data/base-exercises.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const exercises: Partial<Exercise>[] = JSON.parse(raw);

  // Same rename as the RenameExerciseVariants migration, so that seeding
  // before migrating updates the existing rows instead of duplicating them.
  const renamed = await renameLegacyVariants(dataSource);

  if (renamed.length)
    console.log(`Renamed ${renamed.length} exercises to their variant name`);

  let created = 0;
  let updated = 0;

  for (const exercise of exercises) {
    const exists = await repo.findOne({ where: { name: exercise.name } });

    if (exists) {
      repo.merge(exists, exercise);
      await repo.save(exists);
      updated++;
    } else {
      const entity = repo.create(exercise);

      await repo.save(entity);
      created++;
    }
  }
  console.log(`Exercise seed completed: ${created} new, ${updated} updated`);
}
