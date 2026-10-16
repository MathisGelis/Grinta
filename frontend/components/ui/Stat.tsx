import React from "react";
import { Text, View } from "react-native";

type StatProps = {
  value: string | number;
  unit?: string;
  label?: string;
  size?: "xl" | "lg" | "md";
  className?: string;
};

const VALUE = { xl: "text-5xl", lg: "text-3xl", md: "text-xl" };

export default function Stat({
  value,
  unit,
  label,
  size = "lg",
  className = "",
}: StatProps) {
  return (
    <View className={className}>
      <View className="flex-row items-baseline gap-1">
        <Text
          className={`${VALUE[size]} font-semibold text-ink`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {value}
        </Text>
        {unit ? <Text className="text-sm text-ink-muted">{unit}</Text> : null}
      </View>
      {label ? <Text className="mt-0.5 text-xs text-ink-muted">{label}</Text> : null}
    </View>
  );
}
