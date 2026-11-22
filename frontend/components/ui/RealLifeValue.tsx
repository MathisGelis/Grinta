import React from "react";
import { Text, View } from "react-native";
import type { RealLifeObject } from "@/i18n/v3";
import { useTranslation } from "@/contexts/LanguageContext";
import type { RealLifeComparison } from "@/utils/realLife";

const EMOJIS: Record<RealLifeObject, string> = {
  bowling_ball: "🎳",
  golden_retriever: "🐕",
  washing_machine: "🧺",
  giant_panda: "🐼",
  upright_piano: "🎹",
  horse: "🐎",
  car: "🚗",
  white_rhinoceros: "🦏",
  african_elephant: "🐘",
  school_bus: "🚌",
  boeing_737: "✈️",
  statue_of_liberty: "🗽",
};

type Props = {
  comparison?: RealLifeComparison | null;
  /** Taille de l'emoji. */
  size?: number;
  className?: string;
};

/** « ≈ 2.1 × » suivi de l'emoji de l'objet de comparaison, à la place de son nom. */
export default function RealLifeValue({
  comparison,
  size = 20,
  className = "text-sm font-semibold text-ink",
}: Props) {
  const { t } = useTranslation();
  if (!comparison) return null;
  const emoji = EMOJIS[comparison.object];
  if (!emoji) return null;
  const name = t.rlObjects[comparison.object];
  return (
    <View
      className="flex-row items-center gap-1.5"
      accessible
      accessibilityLabel={`≈ ${comparison.count} × ${name}`}
    >
      <Text className={className}>≈ {comparison.count} ×</Text>
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </View>
  );
}
