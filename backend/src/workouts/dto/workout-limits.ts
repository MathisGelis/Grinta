import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * What a workout may hold. Beyond these, the input is a typo or abuse: it
 * would show as « 5256000 min » in the history and skew the volume, the
 * calories and the records. One place, shared by the four workout DTOs.
 */
export const WORKOUT_LIMITS = {
  titleMax: 100,
  descriptionMax: 1000,
  exercisesMax: 40,
  setsMax: 30,
  repsMax: 1000,
  /** A workout lasts a day at most. */
  durationMaxSeconds: 86_400,
  /** Rest and timers: an hour at most. */
  timerMaxSeconds: 3_600,
  /** A workout may be logged from a time zone ahead of the server. */
  completionMaxHoursAhead: 24,
} as const;

/** Whitespace around a title or a description is never meant. */
export const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * An ISO date at most `maxHours` ahead of now. Anything that is not a date is
 * left to @IsDateString, which reports it with its own code.
 */
export function IsNotFarInFuture(
  maxHours: number,
  options?: ValidationOptions,
) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isNotFarInFuture',
      target: object.constructor,
      propertyName,
      constraints: [maxHours],
      options,
      validator: {
        validate: (value: unknown, args: ValidationArguments) => {
          const time = typeof value === 'string' ? Date.parse(value) : NaN;

          return (
            Number.isNaN(time) ||
            time <= Date.now() + (args.constraints[0] as number) * 3_600_000
          );
        },
        defaultMessage: (args: ValidationArguments) =>
          `La date « ${args.property} » ne peut pas dépasser de plus de ${String(args.constraints[0])} h l'heure actuelle.`,
      },
    });
}
