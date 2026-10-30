/**
 * Codes of the insights returned by the stats, translated by the app. The
 * figures behind them are fields of the same response: pushPullRatio and
 * upperLowerRatio for the balance, comparison[metric].changePct and
 * baseline.periodsConsidered for the comparisons.
 */
export enum BalanceInsight {
  /** No pulling volume: the push/pull ratio cannot be computed. */
  INSUFFICIENT_PULL_VOLUME = 'INSUFFICIENT_PULL_VOLUME',
  /** pushPullRatio above 1.3: add pulling work. */
  PUSH_DOMINANT = 'PUSH_DOMINANT',
  /** pushPullRatio under 0.77: add pushing work. */
  PULL_DOMINANT = 'PULL_DOMINANT',
  PUSH_PULL_BALANCED = 'PUSH_PULL_BALANCED',
  NO_LOWER_BODY_VOLUME = 'NO_LOWER_BODY_VOLUME',
  /** upperLowerRatio above 2: add leg work. */
  UPPER_BODY_DOMINANT = 'UPPER_BODY_DOMINANT',
  /** upperLowerRatio under 0.5: upper body may be undertrained. */
  LOWER_BODY_DOMINANT = 'LOWER_BODY_DOMINANT',
}

export enum ComparisonInsight {
  /** No full period of history to compare with. */
  NOT_ENOUGH_HISTORY = 'NOT_ENOUGH_HISTORY',
  WORKOUTS_ON_TRACK = 'WORKOUTS_ON_TRACK',
  WORKOUTS_ABOVE_USUAL = 'WORKOUTS_ABOVE_USUAL',
  WORKOUTS_BELOW_USUAL = 'WORKOUTS_BELOW_USUAL',
  VOLUME_ON_TRACK = 'VOLUME_ON_TRACK',
  VOLUME_ABOVE_USUAL = 'VOLUME_ABOVE_USUAL',
  VOLUME_BELOW_USUAL = 'VOLUME_BELOW_USUAL',
}
