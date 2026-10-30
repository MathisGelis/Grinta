import React from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";
import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import Screen from "@/components/ui/Screen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function PremiumScreen() {
  const { t } = useTranslation();
  const benefits = [
    t.premiumBenefit1,
    t.premiumBenefit2,
    t.premiumBenefit3,
    t.premiumBenefit4,
  ];

  const swipeLeftToClose = Gesture.Fling()
    .direction(Directions.LEFT)
    .runOnJS(true)
    .onEnd(() => router.back());

  return (
    <GestureDetector gesture={swipeLeftToClose}>
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader title={t.premiumTitle} />

      <Screen topInset={false}>
        <Card size="hero" className="items-center gap-3 py-8">
          <View
            className="h-24 w-24 items-center justify-center rounded-full bg-warning-tint"
          >
            <MaterialCommunityIcons
              name="crown"
              size={48}
              color={WorkoutTheme.status.warning}
            />
          </View>
          <Text className="mt-2 text-center text-3xl font-semibold text-ink">
            {t.premiumTitle}
          </Text>
          <Text className="text-center text-base text-ink-muted">
            {t.premiumSubtitle}
          </Text>
        </Card>

        <View className="gap-3">
          {benefits.map((benefit) => (
            <View
              key={benefit}
              className="flex-row items-center gap-3 rounded-card bg-surface p-4"
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-full bg-warning-tint"
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={WorkoutTheme.status.warning}
                />
              </View>
              <Text className="flex-1 text-base text-ink">{benefit}</Text>
            </View>
          ))}
        </View>

        <View className="gap-3">
          <Button
            icon="sparkles"
            label={t.premiumCta}
            onPress={() => Alert.alert(t.premiumTitle, t.comingSoonText)}
          />
          <Text className="text-center text-xs text-ink-muted">{t.premiumNote}</Text>
        </View>
      </Screen>
    </View>
    </GestureDetector>
  );
}
