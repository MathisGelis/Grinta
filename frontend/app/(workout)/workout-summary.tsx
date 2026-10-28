import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StatusBar, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";

import { WorkoutTheme } from "@/constants/Colors";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
export default function WorkoutSummaryScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const workoutName = params.workoutName as string;
  const totalTime = parseInt(params.totalTime as string) || 0;

  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scaleAnim]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min ${secs}s`;
  };

  const stats = {
    calories: 520,
    exercises: 3,
    sets: 11,
    reps: 91,
    volume: 2750,
  };

  const goHome = () => {
    router.push("/(tabs)/explore");
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1">
      <ScreenBackground />
      <StatusBar barStyle="light-content" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="items-center justify-center py-12"
        >
          <View
            className="rounded-full p-6 mb-6 bg-accent"
            
          >
            <Ionicons name="checkmark" size={64} color="white" />
          </View>
          <Text className="text-3xl font-bold text-ink text-center">
            {t.workoutComplete}
          </Text>
          <Text className="text-base text-ink-muted text-center mt-2">
            {t.greatEffortToday}
          </Text>
        </Animated.View>

        <View className="px-4 mb-6">
          <View className="bg-surface rounded-tile p-6 border border-line">
            <Text className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-2">
              {t.workoutsLabel}
            </Text>
            <Text className="text-2xl font-bold text-ink mb-4">
              {workoutName}
            </Text>

            <View className="flex-row justify-between items-center pt-4 border-t border-line">
              <View>
                <Text className="text-xs text-ink-muted uppercase font-semibold mb-1">
                  {t.totalTime}
                </Text>
                <Text className="text-2xl font-bold text-ink">
                  {formatTime(totalTime)}
                </Text>
              </View>
              <Ionicons name="time" size={32} color={WorkoutTheme.accent.purple} />
            </View>
          </View>
        </View>

        <View className="px-4 mb-6">
          <Text className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-3">
            {t.summary}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <View className="flex-1 min-w-[47%] bg-surface rounded-xl p-4 border border-line">
              <View className="mb-3">
                <Ionicons name="flame" size={24} color={WorkoutTheme.status.danger} />
              </View>
              <Text className="text-xs text-ink-muted uppercase font-semibold mb-1">
                {t.calories}
              </Text>
              <Text className="text-2xl font-bold text-ink">
                {stats.calories}
                <Text className="text-sm text-ink-muted"> kcal</Text>
              </Text>
            </View>

            <View className="flex-1 min-w-[47%] bg-surface rounded-xl p-4 border border-line">
              <View className="mb-3">
                <Ionicons name="barbell" size={24} color={WorkoutTheme.status.info} />
              </View>
              <Text className="text-xs text-ink-muted uppercase font-semibold mb-1">
                {t.exercises}
              </Text>
              <Text className="text-2xl font-bold text-ink">
                {stats.exercises}
              </Text>
            </View>

            <View className="flex-1 min-w-[47%] bg-surface rounded-xl p-4 border border-line">
              <View className="mb-3">
                <Ionicons name="layers" size={24} color={WorkoutTheme.accent.purple} />
              </View>
              <Text className="text-xs text-ink-muted uppercase font-semibold mb-1">
                {t.sets}
              </Text>
              <Text className="text-2xl font-bold text-ink">
                {stats.sets}
              </Text>
            </View>

            <View className="flex-1 min-w-[47%] bg-surface rounded-xl p-4 border border-line">
              <View className="mb-3">
                <Ionicons name="repeat" size={24} color={WorkoutTheme.status.info} />
              </View>
              <Text className="text-xs text-ink-muted uppercase font-semibold mb-1">
                {t.totalReps}
              </Text>
              <Text className="text-2xl font-bold text-ink">
                {stats.reps}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 mb-6">
          <View className="bg-surface rounded-xl p-4 border border-line flex-row items-center gap-4">
            <View
              className="rounded-full p-3 bg-accent/20"
              
            >
              <Ionicons name="cube" size={24} color={WorkoutTheme.status.warning} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-ink-muted uppercase font-semibold mb-1">
                {t.totalVolume}
              </Text>
              <Text className="text-xl font-bold text-ink">
                {stats.volume.toLocaleString()}
                <Text className="text-sm text-ink-muted"> kg</Text>
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 mb-8">
          <View
            className="rounded-xl p-4 flex-row items-center gap-3 bg-accent"
            
          >
            <Ionicons name="star" size={28} color="white" />
            <View className="flex-1">
              <Text className="text-ink font-bold text-sm">
                {t.greatConsistency}
              </Text>
              <Text className="text-ink/80 text-xs">
                5 {t.weeklyWorkoutsDone}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="bg-surface border-t border-line px-4 py-4 gap-2">
        <PressableScale
          onPress={goHome}
          className="rounded-full py-4 items-center justify-center flex-row gap-2 bg-accent"
          
        >
          <Ionicons name="home" size={20} color="white" />
          <Text className="text-ink font-bold text-lg">{t.goHome}</Text>
        </PressableScale>
        <PressableScale
          onPress={goBack}
          className="bg-raised rounded-lg py-3 items-center justify-center"
        >
          <Text className="text-ink font-semibold">{t.backToWorkouts}</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}
