import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/** Body measures the profile accepts: beyond these it is a typo or abuse. */
export const PROFILE_LIMITS = {
  heightMinCm: 50,
  heightMaxCm: 250,
  weightMinKg: 20,
  weightMaxKg: 400,
  /** Youngest age allowed to have an account. */
  minAgeYears: 13,
  earliestBirthYear: 1900,
} as const;

/**
 * An ISO birth date from 1900 to today minus 13 years. Anything that is not
 * a date is left to @IsDateString, which reports it with its own code.
 */
export function IsBirthDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isBirthDate',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (value: unknown) => {
          const time = typeof value === 'string' ? Date.parse(value) : NaN;

          if (Number.isNaN(time)) return true;
          const latest = new Date();

          latest.setUTCFullYear(
            latest.getUTCFullYear() - PROFILE_LIMITS.minAgeYears,
          );
          return (
            time >= Date.UTC(PROFILE_LIMITS.earliestBirthYear, 0, 1) &&
            time <= latest.getTime()
          );
        },
        defaultMessage: (args: ValidationArguments) =>
          `La date « ${args.property} » doit être entre ${PROFILE_LIMITS.earliestBirthYear} et il y a ${PROFILE_LIMITS.minAgeYears} ans.`,
      },
    });
}
