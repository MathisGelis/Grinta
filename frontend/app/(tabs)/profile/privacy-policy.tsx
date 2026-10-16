import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useTranslation } from "@/contexts/LanguageContext";
import ScreenHeader from "@/components/ui/ScreenHeader";

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1">
      <ScreenHeader title={t.privacyPolicy} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }}
      >
        <Text className="text-ink-faint text-[13px] mb-4">{t.privacyLastUpdated}</Text>

        <Text className="text-ink-muted text-sm leading-[22px] mb-7">
          {t.privacyIntro}
        </Text>

        {t.privacySections.map((section, i) => (
          <View key={i} className="mb-6">
            <Text className="text-ink text-[15px] font-bold mb-2">{section.title}</Text>
            <Text className="text-ink-muted text-sm leading-[22px]">{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
