import React from "react";
import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { WorkoutTheme } from "@/constants/Colors";

type DifficultyPickerProps = {
  label: string;
  /** Niveau de 1 à 3 */
  level: number;
  levelLabel: string;
  onChange: (level: number) => void;
};

const BAR_HEIGHTS = [16, 28, 40];

/** 3 colonnes croissantes (comme l'icône stats) remplies selon la difficulté, avec boutons − / +. */
export default function DifficultyPicker({
  label,
  level,
  levelLabel,
  onChange,
}: DifficultyPickerProps) {
  const accent = WorkoutTheme.accent.purple;

  const renderStep = (icon: "remove" | "add", delta: number) => {
    const next = level + delta;
    const disabled = next < 1 || next > 3;
    return (
      <Pressable
        key={icon}
        onPress={() => !disabled && onChange(next)}
        hitSlop={10}
        accessibilityRole="button"
        style={{ opacity: disabled ? 0.35 : 1 }}
      >
        <Ionicons name={icon} size={24} color={accent} />
      </Pressable>
    );
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 16 }}>
        <Text className="text-sm text-ink-muted">{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {renderStep("remove", -1)}
          {renderStep("add", 1)}
        </View>
      </View>
      <View style={{ alignItems: "center", marginTop: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 40 }}>
          {BAR_HEIGHTS.map((height, i) => (
            <Pressable
              key={i}
              onPress={() => onChange(i + 1)}
              hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}
              accessibilityRole="button"
              style={{
                width: 14,
                height,
                borderRadius: 4,
                backgroundColor: i < level ? accent : WorkoutTheme.backgroundTertiary,
              }}
            />
          ))}
        </View>
        <Text className="text-base text-ink" style={{ marginTop: 14 }}>{levelLabel}</Text>
      </View>
    </View>
  );
}
