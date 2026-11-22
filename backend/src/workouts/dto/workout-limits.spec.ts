import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateCompletedWorkoutDto } from './create-completed-workout.dto';

const hours = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const completionErrors = (completionDate: unknown) =>
  validateSync(
    plainToInstance(CreateCompletedWorkoutDto, {
      title: 'Séance',
      completionDate,
      totalDurationSeconds: 60,
      exercises: [
        {
          exerciseId: '7f1c3a6e-2b4d-4c8e-9a0b-1d2e3f405162',
          sets: [{ reps: 5, weight: 20 }],
        },
      ],
    }),
  )
    .filter((e) => e.property === 'completionDate')
    .flatMap((e) => Object.keys(e.constraints ?? {}));

describe('completionDate', () => {
  it('accepts the past and up to a day ahead', () => {
    expect(completionErrors(hours(-1000))).toEqual([]);
    expect(completionErrors(hours(0))).toEqual([]);
    expect(completionErrors(hours(23.5))).toEqual([]);
  });

  it('refuses more than a day ahead', () => {
    expect(completionErrors(hours(24.5))).toEqual(['isNotFarInFuture']);
    expect(completionErrors('2099-01-01T00:00:00Z')).toEqual([
      'isNotFarInFuture',
    ]);
  });

  it('leaves a bad date to the date check alone', () => {
    expect(completionErrors('pas une date')).toEqual(['isDateString']);
    expect(completionErrors(undefined)).toEqual(['isDateString']);
  });
});

describe('title', () => {
  const titleErrors = (title: unknown) =>
    validateSync(
      plainToInstance(CreateCompletedWorkoutDto, {
        title,
        completionDate: hours(0),
        totalDurationSeconds: 60,
        exercises: [{ exerciseId: '7f1c3a6e-2b4d-4c8e-9a0b-1d2e3f405162' }],
      }),
    )
      .filter((e) => e.property === 'title')
      .flatMap((e) => Object.keys(e.constraints ?? {}));

  it('is trimmed, 1 to 100 characters', () => {
    expect(titleErrors('x'.repeat(100))).toEqual([]);
    expect(titleErrors('x'.repeat(101))).toEqual(['maxLength']);
    expect(titleErrors('   ')).toEqual(['minLength']);
    expect(titleErrors('')).toEqual(['minLength']);
  });
});
