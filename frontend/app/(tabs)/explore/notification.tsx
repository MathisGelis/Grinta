import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";
import { router } from "expo-router";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Card from "@/components/ui/Card";
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"notifications" | "news">("notifications");

  const swipeLeftToClose = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onEnd(() => router.back());

  return (
    <GestureDetector gesture={swipeLeftToClose}>
    <View className="flex-1">
      <ScreenBackground flat />
      <View className="flex-row items-center justify-between px-4 pt-16 pb-4">
        <PressableScale onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={WorkoutTheme.text.primary} />
        </PressableScale>
        <Text className="text-ink text-lg font-bold">{t.notifications}</Text>
        <View className="w-10" />
      </View>

      <View className="px-5 pb-4">
        <SegmentedControl
          id="notification-tab"
          options={[
            { value: "notifications", label: t.notifications },
            { value: "news", label: t.newsTab },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>

      {tab === "notifications" ? (
        <View className="items-center mt-20 gap-3">
          <Ionicons name="notifications-off-outline" size={48} color={WorkoutTheme.text.disabled} />
          <Text className="text-ink-faint text-base">{t.noNotifications}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 px-5 pb-10">
          <Card size="card" className="gap-3 overflow-hidden p-0">
            <Image
              source={require("@/assets/onboarding1.jpg")}
              contentFit="cover"
              style={{ width: "100%", height: 180 }}
            />
            <View className="gap-2 px-5 pb-5">
              <Text className="text-xs font-semibold uppercase text-accent-light">{t.newsBetaTag}</Text>
              <Text className="text-xl font-bold text-ink">{t.newsBetaTitle}</Text>
              <Text className="text-sm leading-5 text-ink-soft">{t.newsBetaBody}</Text>
            </View>
          </Card>
        </ScrollView>
      )}
    </View>
    </GestureDetector>
  );
}
