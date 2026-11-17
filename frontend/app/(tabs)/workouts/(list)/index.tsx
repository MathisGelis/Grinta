import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PressableScale from "@/components/ui/PressableScale";
import { useFocusEffect, router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import WorkoutCard from "@/components/workout/card/WorkoutCard";
import EmptyHint from "@/components/workout/EmptyHint";
import WorkoutsListSheet from "@/components/workout/WorkoutsListSheet";
import IconButton from "@/components/ui/IconButton";
import {
  plannedWorkoutsList,
  PlannedWorkout,
} from "@/services/workouts.service";
import ProgrammeHero, { ProgrammeHeroEmpty } from "@/components/workout/programmes/ProgrammeHero";
import SectionHeader from "@/components/ui/SectionHeader";
import ProgrammeRail from "@/components/workout/programmes/ProgrammeRail";
import {
  getTodayProgramme,
  programmsList,
  SmallProgramm,
} from "@/services/programms.service";
import { localDate } from "@/utils/date";
import { WorkoutsNavBar } from "@/components/workout/WorkoutsNavBar";
import { useBottomOffset } from "@/hooks/useKeyboardOffset";
import { WorkoutListSkeleton } from "@/components/ui/skeletons";

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const bottomOffset = useBottomOffset();
  const [workouts, setWorkouts] = useState<PlannedWorkout[]>(
    () => plannedWorkoutsList.peek() ?? [],
  );
  const [programmes, setProgrammes] = useState<SmallProgramm[]>(
    () => programmsList.peek() ?? [],
  );
  const [activeProgrammeId, setActiveProgrammeId] = useState<string | undefined>();
  const [activeDay, setActiveDay] = useState<number | undefined>();
  const [startedOn, setStartedOn] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(() => plannedWorkoutsList.peek() === null);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"programmes" | "sessions" | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  const loadWorkouts = useCallback(async () => {
    try {
      setError(null);
      const [list, programmeList, today] = await Promise.all([
        plannedWorkoutsList.load(),
        programmsList.load().catch(() => programmsList.peek() ?? []),
        getTodayProgramme(localDate()).catch(() => null),
      ]);
      setWorkouts(list);
      setProgrammes(programmeList);
      setActiveProgrammeId(today?.programme.id);
      setActiveDay(today?.dayNumber);
      setStartedOn(today?.startedOn);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadingError);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  useEffect(() => {
    plannedWorkoutsList.set(workouts);
  }, [workouts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorkouts().finally(() => setRefreshing(false));
  }, [loadWorkouts]);

  const activeProgramme = useMemo(
    () => programmes.find((p) => p.id === activeProgrammeId),
    [programmes, activeProgrammeId],
  );

  const rail = (
    <View>
      <View className="-mx-5">
        <WorkoutsNavBar />
      </View>
      <View className="gap-6">
      {activeProgramme && activeDay != null ? (
        <ProgrammeHero programme={activeProgramme} dayNumber={activeDay} startedOn={startedOn} />
      ) : (
        <ProgrammeHeroEmpty onChoose={() => setSheet("programmes")} />
      )}
      <ProgrammeRail
        programmes={programmes.filter((p) => p.id !== activeProgrammeId)}
        onSearch={() => setSheet("programmes")}
        empty={programmes.filter((p) => p.id !== activeProgrammeId).length === 0}
        hasActive={!!activeProgramme}
      />
      <SectionHeader
        title={t.sessions}
        className="mb-4"
        right={
          <>
            <IconButton
              icon="add"
              variant="accent"
              size={40}
              label={t.createWorkout}
              onPress={() => router.push("/(tabs)/workouts/create/workout")}
            />
            <IconButton
              icon="search-outline"
              size={40}
              label={t.searchLabel}
              onPress={() => setSheet("sessions")}
            />
          </>
        }
      />
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: PlannedWorkout }) => <WorkoutCard workout={item} />,
    [],
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={WorkoutTheme.accent.purple}
      colors={[WorkoutTheme.accent.purple]}
    />
  );

  return (
    <View className="flex-1">
      {loading ? (
        <View className="flex-1">
          <WorkoutsNavBar />
          <View className="flex-1 px-4 pt-4">
            <WorkoutListSkeleton count={4} />
          </View>
        </View>
      ) : error ? (
        <View className="flex-1">
          <WorkoutsNavBar />
          <View className="flex-1 items-center justify-center px-8 py-[60px]">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-danger-tint">
            <Ionicons name="alert-circle" size={48} color={WorkoutTheme.status.danger} />
          </View>
          <Text className="mb-2 text-xl font-bold text-ink">{t.oops}</Text>
          <Text className="text-center text-sm leading-[20px] text-ink-muted">{error}</Text>
          <PressableScale
            onPress={() => {
              setLoading(true);
              loadWorkouts();
            }}
            className="mt-6 h-[52px] flex-row items-center gap-2 rounded-full bg-accent px-6"
          >
            <Ionicons name="refresh" size={20} color={WorkoutTheme.text.primary} />
            <Text className="text-sm font-semibold text-ink">{t.retryBtn}</Text>
          </PressableScale>
          </View>
        </View>
      ) : (
        <FlatList {...chromeScrollProps}
          data={workouts}
          ListHeaderComponent={rail}
          ListEmptyComponent={
            <EmptyHint
              icon="barbell-outline"
              message={t.emptyWorkoutsHint}
              actionLabel={t.createWorkout}
              onAction={() => router.push("/(tabs)/workouts/create/workout")}
            />
          }
          keyExtractor={(w) => w.id}
          renderItem={renderItem}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          contentContainerClassName="px-5 pt-2"
          contentContainerStyle={{ paddingTop: 0, paddingBottom: bottomOffset + 80 }}
        />
      )}

      <WorkoutsListSheet
        visible={sheet !== null}
        kind={sheet ?? "sessions"}
        onClose={closeSheet}
        programmes={programmes}
        workouts={workouts}
        onProgrammeAdded={loadWorkouts}
      />
    </View>
  );
}
