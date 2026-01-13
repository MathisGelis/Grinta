import { DataSource } from 'typeorm';
import { Exercise } from '../entities/exercise.entity';
import * as fs from 'fs';
import * as path from 'path';

export async function seedExercises(dataSource: DataSource) {
  const repo = dataSource.getRepository(Exercise);

  const filePath = path.join(__dirname, '../data/base-exercises.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const exercises: Partial<Exercise>[] = JSON.parse(raw);

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
