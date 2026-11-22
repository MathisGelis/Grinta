/** A first-versus-latest change within this many percent is reported as flat. */
export const TREND_FLAT_THRESHOLD_PCT = 5;

/** Most points averaged at each end of the series to smooth a single bad day. */
export const TREND_SAMPLE_SIZE = 3;

/** Heatmap intensity levels, 0 is a rest day and the maximum is the busiest. */
export const HEATMAP_MAX_LEVEL = 4;

/** Adherence score at or above which a workout is rated at that level. */
export const ADHERENCE_RATING_THRESHOLDS = {
  full: 100,
  high: 80,
  partial: 50,
} as const;
