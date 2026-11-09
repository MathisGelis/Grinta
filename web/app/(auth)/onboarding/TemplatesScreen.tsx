import React from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import ScreenBackground from "@/components/ui/ScreenBackground";
import SkipLink from "@/components/ui/SkipLink";
import TemplatePicker from "@/components/workout/programmes/TemplatePicker";
import { useTranslation } from "@/contexts/LanguageContext";

export default function TemplatesScreen() {
  const { t } = useTranslation();
  const done = () => router.replace("/(tabs)/explore");

  return (
    <View className="flex-1 pt-20">
      <ScreenBackground />
      <SkipLink className="absolute right-6 top-12" label={t.tplSkip} onPress={done} />
      <ScrollView contentContainerClassName="gap-3 px-8 pb-16" showsVerticalScrollIndicator={false}>
        <Text className="text-[28px] font-bold text-ink">{t.tplTitle}</Text>
        <Text className="mb-4 text-[15px] text-ink-muted">{t.tplIntro}</Text>
        <TemplatePicker onUsed={done} />
      </ScrollView>
    </View>
  );
}
