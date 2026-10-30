import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAllExercises } from "@/services/exercises.service";

import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
}

export default function WorkoutDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    category: string;
    duration: string;
    calories: string;
    description: string;
  }>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const title = params.title || t.workoutsLabel;
  const category = params.category || "";
  const duration = params.duration || "";
  const calories = params.calories || "";
  const description = params.description || "";

  useEffect(() => {
    async function fetchExercises() {
      try {
        // Catalogue en cache local : évite de retélécharger tout `/exercises` à chaque ouverture.
        setExercises(await getAllExercises());
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchExercises();
  }, []);

  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        barStyle="light-content"
      />

      <View style={styles.heroContainer}>
        <View className="flex-1 items-center justify-center">
          <Ionicons name="barbell" size={64} color={withAlpha(WorkoutTheme.accent.purple, 0.2)} />
        </View>
        <SafeAreaView className="absolute top-0 left-0 right-0" edges={["top"]}>
          <PressableScale
            className="m-4 w-10 h-10 rounded-full bg-glass-strong justify-center items-center"
            onPress={() => router.back()}
          >
            <Text className="text-xl text-background font-bold leading-[22px]">←</Text>
          </PressableScale>
        </SafeAreaView>
      </View>

      <ScrollView
        className="flex-1 bg-surface rounded-tl-[24px] rounded-tr-[24px] -mt-6"
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-ink mb-1.5">{title}</Text>
        {category ? <Text className="text-sm text-accent-light font-semibold mb-4">{t.workoutsLabel} · {category}</Text> : null}

        {(duration || calories) && (
          <View className="flex-row gap-2.5 mb-4">
            {duration ? (
              <View className="bg-raised rounded-tile px-4 py-2">
                <Text className="text-ink text-[13px] font-semibold">▶ {duration}</Text>
              </View>
            ) : null}
            {calories ? (
              <View className="bg-raised rounded-tile px-4 py-2">
                <Text className="text-ink text-[13px] font-semibold">🔥 {calories} {t.calShort}</Text>
              </View>
            ) : null}
          </View>
        )}

        {description ? <Text className="text-sm text-ink-soft leading-[22px] mb-6">{description}</Text> : null}

        <Text className="text-lg font-bold text-ink mb-3">{t.exercises}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={WorkoutTheme.accent.purple} style={{ marginTop: 16 }} />
        ) : exercises.length === 0 ? (
          <View className="bg-raised rounded-tile p-5 items-center">
            <Text className="text-ink-faint text-sm">{t.noExerciseAvailable}</Text>
          </View>
        ) : (
          exercises.map((ex) => (
            <View key={ex.id} className="flex-row items-center bg-raised rounded-tile p-3.5 mb-2.5">
              <View className="w-12 h-12 rounded-full bg-accent-tint items-center justify-center mr-3">
                <Ionicons name="fitness-outline" size={24} color={WorkoutTheme.accent.purple} />
              </View>
              <View className="flex-1">
                <Text className="text-ink text-sm font-semibold mb-1">{ex.name}</Text>
                {ex.muscleGroup && (
                  <Text className="text-accent-light text-[13px] font-medium">{ex.muscleGroup}</Text>
                )}
              </View>
              <Text className="text-ink-muted text-[22px] pl-2">›</Text>
            </View>
          ))
        )}

        <View className="h-[90px]" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-surface px-5 py-4 pb-8">
        <PressableScale className="bg-accent rounded-full py-4 items-center">
          <Text className="text-ink text-base font-bold">{t.startWorkout}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  heroContainer: {
    height: SCREEN_HEIGHT * 0.3,
    position: "relative",
    backgroundColor: WorkoutTheme.backgroundSecondary,
  },

  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

});
