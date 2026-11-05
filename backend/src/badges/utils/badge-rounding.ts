import {
  roundEstimate,
  roundLoad,
  roundVolume,
} from '../../common/utils/numbers';
import { BadgeType } from '../enums/badge-type.enum';

/** A badge's value as the API returns it, by kind of record. */
export function roundBadgeValue(type: BadgeType, value: number): number {
  switch (type) {
    case BadgeType.BEST_ESTIMATED_1RM:
      return roundEstimate(value);
    case BadgeType.BEST_SESSION_VOLUME:
      return roundVolume(value);
    case BadgeType.HEAVIEST_WEIGHT:
      return roundLoad(value);
    default:
      return Math.round(value);
  }
}
