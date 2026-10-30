import { format } from "@/i18n/translations";
import type { Strings } from "@/i18n/translations";
import type { RealLifeObject } from "@/i18n/v3";

/** `null` sous 7 kg ; `count` vaut au moins 1, avec une décimale. */
export interface RealLifeComparison {
  object: RealLifeObject;
  count: number;
}

export const REAL_LIFE_EMOJI: Record<RealLifeObject, string> = {
  bowling_ball: "🎳",
  golden_retriever: "🐕",
  washing_machine: "🧺",
  giant_panda: "🐼",
  upright_piano: "🎹",
  horse: "🐴",
  car: "🚗",
  white_rhinoceros: "🦏",
  african_elephant: "🐘",
  school_bus: "🚌",
  boeing_737: "✈️",
  statue_of_liberty: "🗽",
};

/** « ≈ 2.1 × 🦏 » : l'objet de comparaison est affiché sous forme d'emoji. */
export function realLifeText(
  t: Strings,
  comparison?: RealLifeComparison | null,
): string | null {
  if (!comparison) return null;
  const emoji = REAL_LIFE_EMOJI[comparison.object];
  if (!emoji) return null;
  return format(t.rlLine, { count: comparison.count, object: emoji });
}
