import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "@/contexts/LanguageContext";
import { router } from "expo-router";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";

import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const headerHeight = useFloatingHeaderHeight();
  const [tab, setTab] = useState<"notifications" | "news">("notifications");

  const swipeLeftToClose = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onEnd(() => router.back());

  return (
    <GestureDetector gesture={swipeLeftToClose}>
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader floating title={t.notifications} onBack={() => router.back()} />

      <ScrollView
        {...chromeScrollProps}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 px-5 pb-10"
        contentContainerStyle={{ paddingTop: headerHeight }}
      >
        <SegmentedControl
          id="notification-tab"
          options={[
            { value: "notifications", label: t.notifications },
            { value: "news", label: t.newsTab },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "notifications" ? (
          <EmptyState icon="notifications-off-outline" title={t.noNotifications} className="mt-4" />
        ) : (
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
        )}
      </ScrollView>
    </View>
    </GestureDetector>
  );
}
