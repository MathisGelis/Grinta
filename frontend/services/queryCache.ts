import { onSessionCleared } from "@/core/services/sessionReset";

type Entry = { value: unknown; at: number };

const entries = new Map<string, Entry>();
onSessionCleared(() => entries.clear());

/**
 * Cache mémoire des écrans (profil, stats, records…) : on réaffiche tout de suite la dernière
 * réponse et on la rafraîchit en arrière-plan. Vidé à la déconnexion.
 */
export const queryCache = {
  peek<T>(key: string): T | undefined {
    return entries.get(key)?.value as T | undefined;
  },
  set<T>(key: string, value: T) {
    entries.set(key, { value, at: Date.now() });
  },
  /** Vrai si la valeur existe et a moins de `maxAgeMs`. */
  isFresh(key: string, maxAgeMs: number): boolean {
    const entry = entries.get(key);
    return !!entry && Date.now() - entry.at < maxAgeMs;
  },
  /** Force le prochain affichage à re-télécharger (la valeur reste affichable en attendant). */
  invalidate(...prefixes: string[]) {
    for (const [key, entry] of entries) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) entry.at = 0;
    }
  },
};
