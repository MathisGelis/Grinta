import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { Badge, BadgesService } from "@/services/badges.service";
import { ExerciseStats, getAllExerciseStats } from "@/services/exercises.service";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import SegmentedControl from "@/components/ui/SegmentedControl";
import PressableScale from "@/components/ui/PressableScale";
import Stat from "@/components/ui/Stat";
import BadgeList from "@/components/workout/badges/BadgeList";

type Tab = "exercises" | "badges";

const kg = (v: number | null) => (v != null ? `${Math.round(v * 10) / 10}` : "–");

export default function RecordsScreen() {
  const { t, lang } = useTranslation();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("exercises");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ExerciseStats[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [exerciseStats, userBadges] = await Promise.all([
        getAllExerciseStats(),
        BadgesService.list({ limit: 100 }),
      ]);
      setStats(exerciseStats);
      setBadges(userBadges);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const muscle = (key: string) => t.muscleNames[key] ?? key.replace(/_/g, " ");

  const empty = (
    <View className="items-center gap-2 rounded-card bg-surface p-8">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-raised">
        <Ionicons name="trophy-outline" size={26} color={WorkoutTheme.text.tertiary} />
      </View>
      <Text className="text-base font-semibold text-ink-soft">{t.noRecordsYet}</Text>
      <Text className="text-center text-sm text-ink-muted">{t.noRecordsHint}</Text>
    </View>
  );

  return (
    <View className="flex-1">
      <ScreenBackground />
      <ScreenHeader title={t.myRecordsTitle} />

      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : error ? (
        <View className="items-center px-5">
          <Text className="text-danger">{error}</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        >
          <SegmentedControl<Tab>
            id="records-tab"
            value={tab}
            onChange={setTab}
            options={[
              { value: "exercises", label: t.exercises },
              { value: "badges", label: t.recordsBadgesTab },
            ]}
          />

          {tab === "exercises" ? (
            stats.length === 0 ? (
              empty
            ) : (
              stats.map((s) => (
                <PressableScale
                  key={s.exerciseId}
                  accessibilityRole="button"
                  accessibilityLabel={s.exerciseName}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/workouts/exercise-detail",
                      params: { exerciseId: s.exerciseId },
                    } as any)
                  }
                  className="gap-4 rounded-card bg-surface p-4"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                        {s.exerciseName}
                      </Text>
                      <Text className="mt-0.5 text-xs text-ink-muted">
                        {muscle(s.primaryMuscle)}
                        {s.lastPerformedAt
                          ? ` · ${new Date(s.lastPerformedAt).toLocaleDateString(lang)}`
                          : ""}
                      </Text>
                    </View>
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-raised">
                      <MaterialCommunityIcons name="arrow-top-right" size={18} color={WorkoutTheme.text.primary} />
                    </View>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1 rounded-tile bg-accent-tint p-3">
                      <Stat size="md" value={kg(s.prWeight)} unit="kg" label={t.personalRecordLabel} />
                    </View>
                    <View className="flex-1 rounded-tile bg-raised p-3">
                      <Stat size="md" value={kg(s.bestEstimatedOneRepMax)} unit="kg" label={t.recordOneRm} />
                    </View>
                    <View className="flex-1 rounded-tile bg-raised p-3">
                      <Stat size="md" value={s.totalSessions} label={t.sessions} />
                    </View>
                  </View>
                </PressableScale>
              ))
            )
          ) : badges.length === 0 ? (
            empty
          ) : (
            <BadgeList badges={badges} showDate />
          )}
        </ScrollView>
      )}
    </View>
  );
}
