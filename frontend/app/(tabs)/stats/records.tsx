import { formatDate } from "@/utils/formatDate";
import { useUnits } from "@/contexts/UnitsContext";
import React, { useMemo, useState } from "react";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { FlatList, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { Badge, BadgesService } from "@/services/badges.service";
import { ExerciseStats, getExerciseStatsPage } from "@/services/exercises.service";
import ErrorState from "@/components/ui/ErrorState";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import SegmentedControl from "@/components/ui/SegmentedControl";
import PressableScale from "@/components/ui/PressableScale";
import Stat from "@/components/ui/Stat";
import { BadgeGroup, groupBadges, type BadgeGroupData } from "@/components/workout/badges/BadgeList";
import { ListSkeleton } from "@/components/ui/skeletons";
import EmptyState from "@/components/ui/EmptyState";

type Tab = "exercises" | "badges";

export default function RecordsScreen() {
  const { t, lang } = useTranslation();
  const { fromKg, weightUnit } = useUnits();
  const kg = (v: number | null) => (v != null ? String(fromKg(v)) : "–");
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("exercises");
  const { data, loading, error, reload } = useCachedQuery("records", async () => {
    const [page, badges] = await Promise.all([getExerciseStatsPage(), BadgesService.list({ limit: 100 })]);
    return { stats: page.items, nextBefore: page.nextBefore, badges };
  });
  // Pages suivantes chargées au défilement ; repart de zéro quand la première page est rafraîchie.
  const [more, setMore] = useState<{ source: unknown; items: ExerciseStats[]; next: string | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const extra = more && more.source === data ? more : null;
  const stats: ExerciseStats[] = useMemo(
    () => [...(data?.stats ?? []), ...(extra?.items ?? [])],
    [data, extra],
  );
  const cursor = extra ? extra.next : (data?.nextBefore ?? null);

  const loadMore = async () => {
    if (tab !== "exercises" || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getExerciseStatsPage(undefined, cursor);
      setMore({ source: data, items: [...(extra?.items ?? []), ...page.items], next: page.nextBefore });
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };
  const badges: Badge[] = useMemo(() => data?.badges ?? [], [data]);

  const muscle = (key: string) => t.muscleNames[key] ?? key.replace(/_/g, " ");

  const empty = (
    <EmptyState icon="trophy-outline" title={t.noRecordsYet} message={t.noRecordsHint} />
  );

  const renderStat = (s: ExerciseStats) => (
        <PressableScale
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
                  ? ` · ${formatDate(s.lastPerformedAt, lang)}`
                  : ""}
              </Text>
            </View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-raised">
              <MaterialCommunityIcons name="arrow-top-right" size={18} color={WorkoutTheme.text.primary} />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-tile bg-accent-tint p-3">
              <Stat size="md" value={kg(s.prWeight)} unit={weightUnit} label={t.personalRecordLabel} />
            </View>
            <View className="flex-1 rounded-tile bg-raised p-3">
              <Stat size="md" value={kg(s.bestEstimatedOneRepMax)} unit={weightUnit} label={t.recordOneRm} />
            </View>
            <View className="flex-1 rounded-tile bg-raised p-3">
              <Stat size="md" value={s.totalSessions} label={t.sessions} />
            </View>
          </View>
        </PressableScale>
  );

  const badgeGroups = useMemo(() => groupBadges(badges), [badges]);

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader title={t.myRecordsTitle} />

      {loading ? (
        <View className="px-5"><ListSkeleton count={7} /></View>
      ) : error ? (
        <View className="px-5">
          <ErrorState
            message={error}
            onRetry={reload}
          />
        </View>
      ) : (
        <FlatList {...chromeScrollProps}
          data={(tab === "exercises" ? stats : badgeGroups) as (ExerciseStats | BadgeGroupData)[]}
          keyExtractor={(item) => ("exerciseId" in item ? item.exerciseId : "")}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ListSkeleton count={2} /> : undefined}
          ListHeaderComponent={
            <SegmentedControl<Tab>
              id="records-tab"
              value={tab}
              onChange={setTab}
              options={[
                { value: "exercises", label: t.exercises },
                { value: "badges", label: t.recordsBadgesTab },
              ]}
            />
          }
          ListEmptyComponent={empty}
          renderItem={({ item }) =>
            tab === "exercises" ? renderStat(item as ExerciseStats) : (
              <BadgeGroup group={item as BadgeGroupData} showDate />
            )
          }
        />
      )}
    </View>
  );
}
