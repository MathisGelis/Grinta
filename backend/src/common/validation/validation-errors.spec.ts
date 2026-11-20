import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { CreateCompletedWorkoutDto } from '../../workouts/dto/create-completed-workout.dto';
import {
  ValidationErrorBody,
  ValidationFailedException,
  validationExceptionFactory,
} from './validation-errors';

// The pipe exactly as configureApp sets it up.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  validationError: { target: true, value: false },
  exceptionFactory: validationExceptionFactory,
});

async function bodyFor(metatype: ArgumentMetadata['metatype'], value: object) {
  try {
    await pipe.transform(value, { type: 'body', metatype });
  } catch (error) {
    expect(error).toBeInstanceOf(ValidationFailedException);
    return (
      error as ValidationFailedException
    ).getResponse() as ValidationErrorBody;
  }
  throw new Error('validation passed');
}

const user = {
  displayName: 'Jean',
  uniqueName: 'jean.dupont',
  email: 'jean@example.com',
  password: 'Password123!',
};

describe('validation errors', () => {
  it('gives a code and a field per error, and a single message', async () => {
    const body = await bodyFor(CreateUserDto, {
      ...user,
      email: 'pas-un-email',
      password: 'court',
    });

    expect(body).toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(typeof body.message).toBe('string');
    expect(body.errors).toEqual(
      expect.arrayContaining([
        {
          field: 'email',
          code: 'EMAIL_INVALID',
          message: 'Adresse e-mail invalide.',
        },
        {
          field: 'password',
          code: 'PASSWORD_TOO_SHORT',
          message: 'Le mot de passe doit contenir au moins 8 caractères.',
        },
      ]),
    );
    expect(body.message).toBe(body.errors[0].message);
  });

  it('keeps the message written in the DTO', async () => {
    const body = await bodyFor(CreateUserDto, {
      ...user,
      uniqueName: 'Jean Dupont',
    });
    const error = body.errors.find((e) => e.field === 'uniqueName');

    expect(error?.code).toBe('USERNAME_INVALID');
    expect(error?.message).toMatch(/^Le pseudo ne peut contenir/);
  });

  it('reports unknown fields', async () => {
    const body = await bodyFor(CreateUserDto, { ...user, isAdmin: true });

    expect(body.errors).toEqual([
      {
        field: 'isAdmin',
        code: 'FIELD_NOT_ALLOWED',
        message: "Le champ « isAdmin » n'est pas accepté.",
      },
    ]);
  });

  it('gives the full path of a nested field', async () => {
    const body = await bodyFor(CreateCompletedWorkoutDto, {
      title: 'Push',
      completionDate: '2026-10-30T10:00:00Z',
      totalDurationSeconds: 3600,
      exercises: [
        {
          exerciseId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          sets: [
            { reps: 8, weight: 60 },
            { reps: 8, weight: 1500 },
          ],
        },
      ],
    });

    expect(body.errors).toEqual([
      {
        field: 'exercises.0.sets.1.weight',
        code: 'VALUE_TOO_LARGE',
        message:
          '« exercises.0.sets.1.weight » doit être inférieur ou égal à 1000.',
      },
    ]);
  });
});
