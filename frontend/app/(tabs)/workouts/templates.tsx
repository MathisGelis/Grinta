import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/ui/Screen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TemplatePicker from "@/components/workout/programmes/TemplatePicker";
import { useTranslation } from "@/contexts/LanguageContext";

export default function TemplatesScreen() {
  const { t } = useTranslation();
  return (
    <View className="flex-1">
      <ScreenHeader title={t.tplTitle} />
      <Screen topInset={false} tabBar={false}>
        <TemplatePicker onUsed={() => router.back()} />
      </Screen>
    </View>
  );
}
