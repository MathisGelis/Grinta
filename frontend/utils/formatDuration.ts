const MAX_PLAUSIBLE_SECONDS = 24 * 3600;

/** Durée lisible : « 45 min », « 3 h 20 ». Une valeur absurde (négative, > 24 h) s'affiche « — ». */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0 || seconds > MAX_PLAUSIBLE_SECONDS) {
    return "—";
  }
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}
