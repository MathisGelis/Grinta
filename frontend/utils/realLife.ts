import { format } from "@/i18n/translations";
import type { Strings } from "@/i18n/translations";
import type { RealLifeObject } from "@/i18n/v3";

/** `null` sous 7 kg ; `count` vaut au moins 1, avec une décimale. */
export interface RealLifeComparison {
  object: RealLifeObject;
  count: number;
}

/** « ≈ 2.1 × rhinocéros blanc » : l'objet de comparaison est affiché par son nom. */
export function realLifeText(
  t: Strings,
  comparison?: RealLifeComparison | null,
): string | null {
  if (!comparison) return null;
  const name = t.rlObjects[comparison.object];
  if (!name) return null;
  return format(t.rlLine, { count: comparison.count, object: name });
}
