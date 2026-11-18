import { BadRequestException } from '@nestjs/common';
import { daysBetween } from './programme-day';

/** Twelve weeks: the longest programme the app lays out. */
export const MAX_PROGRAMME_DAYS = 84;

/**
 * How far from today a programme may start, either way. The app sends the
 * user's local date, which can differ from the server's by a day; a week
 * covers that and a start planned or begun a few days ago.
 */
export const START_DATE_WINDOW_DAYS = 7;

/**
 * The days of a programme are numbered 1 to N, in any order, each once. A
 * duplicate violates the unique index (it was a 500); a gap would leave the
 * length of the cycle ambiguous. A rest day is a day without workout, not a
 * missing number.
 */
export function assertDayNumbers(days: Array<{ dayNumber: number }>): void {
  const seen = new Set<number>();
  const duplicated = new Set<number>();

  for (const { dayNumber } of days)
    if (seen.has(dayNumber)) duplicated.add(dayNumber);
    else seen.add(dayNumber);
  if (duplicated.size)
    throw new BadRequestException({
      statusCode: 400,
      code: 'DAY_NUMBER_DUPLICATE',
      message: `Le jour ${[...duplicated].join(', ')} apparaît plusieurs fois dans le programme.`,
      dayNumbers: [...duplicated],
    });
  for (let expected = 1; expected <= days.length; expected++)
    if (!seen.has(expected))
      throw new BadRequestException({
        statusCode: 400,
        code: 'DAY_NUMBERS_NOT_CONSECUTIVE',
        message: `Les jours doivent être numérotés de 1 à ${days.length} sans trou : le jour ${expected} manque. Un jour de repos est un jour sans séance.`,
        missingDayNumber: expected,
      });
}

/** The start date within `START_DATE_WINDOW_DAYS` of today, else 400. */
export function assertStartDateNear(startDate: string, today: string): void {
  if (Math.abs(daysBetween(today, startDate)) > START_DATE_WINDOW_DAYS)
    throw new BadRequestException({
      statusCode: 400,
      code: 'START_DATE_OUT_OF_RANGE',
      message: `La date de départ doit être à moins de ${START_DATE_WINDOW_DAYS} jours d'aujourd'hui.`,
      windowDays: START_DATE_WINDOW_DAYS,
    });
}
