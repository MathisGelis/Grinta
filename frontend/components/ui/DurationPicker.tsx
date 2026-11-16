import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

type DurationPickerProps = {
  label: string;
  /** Durée en minutes (chaîne, comme l'état de l'écran) */
  value: string;
  onChange: (value: string) => void;
  step?: number;
  max?: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Horloge numérique HH : MM, champs modifiables à la main et boutons − / + pour ajuster. */
export default function DurationPicker({
  label,
  value,
  onChange,
  step = 5,
  max = 600,
}: DurationPickerProps) {
  const accent = WorkoutTheme.accent.purple;
  const total = Math.min(max, Math.max(0, parseInt(value, 10) || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  const [editing, setEditing] = useState<"h" | "m" | null>(null);
  const [draft, setDraft] = useState("");

  const commit = (minutes: number) =>
    onChange(String(Math.min(max, Math.max(0, minutes))));

  const edit = (field: "h" | "m", text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 2);
    setDraft(digits);
    const n = parseInt(digits, 10) || 0;
    commit(field === "h" ? n * 60 + mins : hours * 60 + Math.min(59, n));
  };

  const Step = ({ icon, delta }: { icon: "remove" | "add"; delta: number }) => {
    const next = total + delta;
    const disabled = next < 0 || next > max;
    return (
      <Pressable
        onPress={() => !disabled && commit(next)}
        hitSlop={12}
        accessibilityRole="button"
        style={{ opacity: disabled ? 0.35 : 1 }}
      >
        <Ionicons name={icon} size={28} color={accent} />
      </Pressable>
    );
  };

  const digitStyle = {
    fontSize: 48,
    fontWeight: "700" as const,
    color: WorkoutTheme.text.primary,
    fontVariant: ["tabular-nums" as const],
    textAlign: "center" as const,
    minWidth: 64,
    padding: 0,
  };

  const field = (key: "h" | "m", n: number, unit: string) => (
    <View style={{ alignItems: "center" }}>
      <TextInput
        value={editing === key ? draft : pad(n)}
        onFocus={() => {
          setEditing(key);
          setDraft(pad(n));
        }}
        onBlur={() => setEditing(null)}
        onChangeText={(text) => edit(key, text)}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        accessibilityLabel={unit}
        style={digitStyle}
      />
      <Text className="text-xs text-ink-muted">{unit}</Text>
    </View>
  );

  return (
    <View>
      <Text className="text-sm text-ink-muted" style={{ paddingLeft: 16 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 8 }}>
        <Step icon="remove" delta={-step} />
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 4 }}>
          {field("h", hours, "h")}
          <Text style={{ ...digitStyle, minWidth: 0, color: accent }}>:</Text>
          {field("m", mins, "min")}
        </View>
        <Step icon="add" delta={step} />
      </View>
    </View>
  );
}
