import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { USERNAME_PATTERN, usernameBaseFrom } from './username';

type UserDto = new () => CreateUserDto | UpdateUserDto;

describe('username rules', () => {
  it.each(['paul', 'jean.dupont', 'julie_92', '_ok_', 'a.b.c', 'abc'])(
    'accepts %s',
    (name) => expect(USERNAME_PATTERN.test(name)).toBe(true),
  );

  it.each([
    'jean dupont',
    'élodie',
    'paul.',
    '.paul',
    'paul-martin',
    'paul@',
    'zoé',
    'emoji💪',
  ])('refuses %s', (name) => expect(USERNAME_PATTERN.test(name)).toBe(false));

  it('builds a valid base from any display name', () => {
    expect(usernameBaseFrom('Élodie Martin')).toBe('elodiemartin');
    expect(usernameBaseFrom('Zoé 💪')).toBe('zoe');
    expect(usernameBaseFrom('Al')).toBe('al_');
    expect(usernameBaseFrom('💪💪')).toBe('user');
    expect(usernameBaseFrom('x'.repeat(40))).toHaveLength(25);
    for (const name of ['Élodie Martin', 'Zoé 💪', 'Al', '💪💪', 'Jean-Luc'])
      expect(USERNAME_PATTERN.test(usernameBaseFrom(name))).toBe(true);
  });
});

describe('username validation on the DTOs', () => {
  const errorsOf = async (cls: UserDto, uniqueName: string) =>
    (
      await validate(
        plainToInstance(cls as new () => object, {
          displayName: 'Test',
          email: 'test@example.com',
          password: 'Password123!',
          uniqueName,
        }),
      )
    ).filter((e) => e.property === 'uniqueName');

  it('rejects spaces and accents at sign-up and on profile edit', async () => {
    for (const cls of [CreateUserDto, UpdateUserDto]) {
      expect(await errorsOf(cls, 'jean dupont')).toHaveLength(1);
      expect(await errorsOf(cls, 'élodie')).toHaveLength(1);
    }
  });

  it('still accepts a valid name typed with capitals and spaces around it', async () => {
    expect(await errorsOf(CreateUserDto, '  Paul_92 ')).toHaveLength(0);
  });
});
