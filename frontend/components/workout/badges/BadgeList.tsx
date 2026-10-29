import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Badge, BadgeType } from "@/services/badges.service";

const ICON: Record<BadgeType, keyof typeof Ionicons.glyphMap> = {
  heaviest_weight: "barbell-outline",
  best_estimated_1rm: "flash-outline",
  best_session_volume: "layers-outline",
  most_reps: "repeat-outline",
};

const round = (n: number) => Math.round(n * 10) / 10;

type Props = {
  badges: Badge[];
  showDate?: boolean;
};

/** Records regroupés par exercice : une séance peut en battre plusieurs (charge max + 1RM). */
export default function BadgeList({ badges, showDate = false }: Props) {
  const { t, lang } = useTranslation();

  const label: Record<BadgeType, string> = {
    heaviest_weight: t.recordHeaviest,
    best_estimated_1rm: t.recordOneRm,
    best_session_volume: t.recordSessionVolume,
    most_reps: t.recordMostReps,
  };
  const unit = (b: Badge) => (b.unit === "kg" ? "kg" : t.repsUnit);

  const groups = new Map<string, { name: string; items: Badge[] }>();
  for (const badge of badges) {
    const group = groups.get(badge.exercise.id) ?? { name: badge.exercise.name, items: [] };
    group.items.push(badge);
    groups.set(badge.exercise.id, group);
  }

  return (
    <View className="gap-4">
      {[...groups.entries()].map(([exerciseId, group]) => (
        <View key={exerciseId} className="gap-2">
          <Text className="px-1 text-sm font-semibold text-ink-soft" numberOfLines={1}>
            {group.name}
          </Text>
          {group.items.map((badge) => (
            <View
              key={badge.id}
              className="flex-row items-center gap-3 rounded-tile bg-raised p-3"
              accessible
              accessibilityLabel={`${label[badge.type]}: ${round(badge.value)} ${unit(badge)}`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
                <Ionicons name={ICON[badge.type]} size={20} color={WorkoutTheme.accent.purple} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-ink">{label[badge.type]}</Text>
                <Text className="mt-0.5 text-xs text-ink-muted" numberOfLines={1}>
                  {showDate
                    ? new Date(badge.achievedAt).toLocaleDateString(lang)
                    : `${round(badge.previousValue)} → ${round(badge.value)} ${unit(badge)}`}
                </Text>
              </View>
              <View className="items-end gap-1">
                <Text
                  className="text-base font-semibold text-ink"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {round(badge.value)} {unit(badge)}
                </Text>
                {badge.improvementPct > 0 ? (
                  <View className="rounded-full bg-success-tint px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-success">
                      +{round(badge.improvementPct)}%
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
