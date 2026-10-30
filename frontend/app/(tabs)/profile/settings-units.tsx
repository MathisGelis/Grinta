import React from "react";
import { View, Text } from "react-native";

import { useTranslation } from "@/contexts/LanguageContext";
import { useUnits, type UnitSystem } from "@/contexts/UnitsContext";

import ScreenHeader from "@/components/ui/ScreenHeader";

import PressableScale from "@/components/ui/PressableScale";
export default function SettingsUnitsScreen() {
  const { t } = useTranslation();
  const { system: selected, setSystem: choose } = useUnits();

  const options: { value: UnitSystem; label: string }[] = [
    { value: "metric", label: t.metric },
    { value: "imperial", label: t.imperial },
  ];

  return (
    <View className="flex-1">
      <ScreenHeader title={t.unitsOfMeasure} />

      <View className="mx-5 bg-surface rounded-card overflow-hidden">
        {options.map((opt, i) => (
          <PressableScale
            key={opt.value}
            className={`flex-row items-center px-5 py-5 gap-3.5 ${i < options.length - 1 ? "" : ""}`}
            onPress={() => choose(opt.value)}
          >
            <Text className="flex-1 text-ink text-[15px]">{opt.label}</Text>
            <View className={`w-6 h-6 rounded-full border-[2px] items-center justify-center ${selected === opt.value ? "border-accent" : "border-ink-faint"}`}>
              {selected === opt.value && <View className="w-3 h-3 rounded-full bg-accent" />}
            </View>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}
