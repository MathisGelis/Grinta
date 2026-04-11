import { User } from '../entities/users.entity';
import { DataSource } from 'typeorm';

function generateBaseUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function generateUniqueUsername(
  dataSource: DataSource,
  base: string,
): Promise<string> {
  const userRepo = dataSource.getRepository(User);
  let username = base;
  let counter = 1;

  while (true) {
    const existing = await userRepo.findOne({
      where: { uniqueName: username },
    });

    if (!existing) return username;
    username = `${base}${counter}`;
    counter++;
  }
}

export async function seedUsernames(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const users = await userRepo.find();

  for (const user of users) {
    if (!user.uniqueName) {
      const base = generateBaseUsername(user.displayName || 'user');
      const uniqueName = await generateUniqueUsername(dataSource, base);

      user.uniqueName = uniqueName;
      console.log(`Generated username for ${user.email}: ${uniqueName}`);
      await userRepo.save(user);
    }
  }
}
