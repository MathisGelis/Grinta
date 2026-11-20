import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { queryCache } from "@/services/queryCache";

const DEFAULT_STALE_MS = 20_000;

/**
 * Charge des données à chaque focus de l'écran, avec cache « affiche l'ancien, rafraîchit ensuite ».
 * `loading` n'est vrai qu'au tout premier chargement ; une erreur n'efface pas les données déjà affichées.
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  { staleMs = DEFAULT_STALE_MS }: { staleMs?: number } = {},
) {
  const [data, setData] = useState<T | undefined>(() => queryCache.peek<T>(key));
  const [loading, setLoading] = useState(data === undefined);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    try {
      const fresh = await fetcher();
      queryCache.set(key, fresh);
      setData(fresh);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      const cached = queryCache.peek<T>(key);
      if (cached !== undefined) setData(cached);
      if (cached !== undefined && queryCache.isFresh(key, staleMs)) {
        setLoading(false);
        return;
      }
      void run();
    }, [key, staleMs, run]),
  );

  /** Re-télécharge (avec l'écran de chargement si on n'a encore rien à montrer). */
  const reload = useCallback(() => {
    setError(null);
    if (queryCache.peek(key) === undefined) setLoading(true);
    void run();
  }, [key, run]);

  /** Met à jour les données localement (ex. après une suppression) et dans le cache. */
  const mutate = useCallback(
    (update: (current: T) => T) => {
      setData((current) => {
        if (current === undefined) return current;
        const next = update(current);
        queryCache.set(key, next);
        return next;
      });
    },
    [key],
  );

  return { data, loading, error, reload, mutate };
}
