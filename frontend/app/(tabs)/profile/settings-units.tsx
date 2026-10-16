import React, { useState } from "react";
import { View, Text } from "react-native";


import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/contexts/LanguageContext";

import ScreenHeader from "@/components/ui/ScreenHeader";

import PressableScale from "@/components/ui/PressableScale";
export default function SettingsUnitsScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<"metric" | "imperial">("metric");

  const choose = async (val: "metric" | "imperial") => {
    setSelected(val);
    await AsyncStorage.setItem("units", val);
  };

  const options = [
    { value: "metric" as const, label: t.metric },
    { value: "imperial" as const, label: t.imperial },
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
