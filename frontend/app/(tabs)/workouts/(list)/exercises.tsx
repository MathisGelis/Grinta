import React, {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { WorkoutTheme } from "@/constants/Colors";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, Text, FlatList, Alert, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomOffset } from "@/hooks/useKeyboardOffset";
import { useSectionQuery } from "@/contexts/WorkoutsSearchContext";
import { normalizeText } from "@/utils/text";
import {
  Exercise,
  deleteExercise,
  getAllExercises,
  getUserCreatedExerciseIds,
  peekExercises,
} from "@/services/exercises.service";
import { TokenService } from "@/services/token.service";
import { useFocusEffect, router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  MUSCLE_GROUP_ORDER,
  MuscleGroup,
  muscleGroupOf,
} from "@/components/workout/exercises/muscleGroups";
import ExerciseRow from "@/components/workout/exercises/ExerciseRow";
import ExerciseFilterSheet, {
  ExerciseFilters,
  NO_FILTERS,
} from "@/components/workout/exercises/ExerciseFilterSheet";


type Row =
  | { kind: "header"; key: string; title: string; count: number }
  | { kind: "exercise"; key: string; exercise: Exercise; canDelete: boolean };


export default function ExercisesScreen() {
  const { t } = useTranslation();
  const bottomOffset = useBottomOffset();
  const [exercises, setExercises] = useState<Exercise[]>(
    () => peekExercises() ?? [],
  );
  const [userCreatedIds, setUserCreatedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<ExerciseFilters>(NO_FILTERS);
  const [filterVisible, setFilterVisible] = useState(false);
  const openFilters = useCallback(() => setFilterVisible(true), []);
  const query = useSectionQuery("exercises", openFilters);
  const deferredQuery = useDeferredValue(query);
  const [groupFilter, setGroupFilter] = useState<MuscleGroup | null>(null);
  const [loading, setLoading] = useState(() => peekExercises() === null);
  const [error, setError] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    try {
      setError(null);
      const [allExercises, createdIds] = await Promise.all([
        getAllExercises(),
        getUserCreatedExerciseIds(),
      ]);
      setExercises(allExercises);
      setUserCreatedIds(createdIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadingError);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises]),
  );

  const indexed = useMemo(
    () => exercises.map((exercise) => ({
      exercise,
      lowerName: normalizeText(exercise.name),
    })),
    [exercises],
  );
  const createdSet = useMemo(() => new Set(userCreatedIds), [userCreatedIds]);

  const { sections: rows, groupCounts } = useMemo(() => {
    const needle = normalizeText(deferredQuery.trim());
    const mine: Row[] = [];
    const byGroup = new Map<MuscleGroup, Row[]>();

    for (const { exercise, lowerName } of indexed) {
      if (filters.equipment && exercise.equipment_type !== filters.equipment) continue;
      if (filters.muscle && exercise.primary_muscle !== filters.muscle) continue;
      if (filters.type && exercise.exercise_type !== filters.type) continue;
      if (needle && !lowerName.includes(needle)) continue;

      const canDelete = createdSet.has(exercise.id);
      const row: Row = {
        kind: "exercise",
        key: exercise.id,
        exercise,
        canDelete,
      };
      if (canDelete) {
        mine.push(row);
        continue;
      }
      const group = muscleGroupOf(exercise.primary_muscle);
      const list = byGroup.get(group);
      if (list) list.push(row);
      else byGroup.set(group, [row]);
    }

    const sections: Row[] = [];
    if (mine.length > 0) {
      sections.push(
        { kind: "header", key: "mine", title: t.yourExercises, count: mine.length },
        ...mine,
      );
    }
    for (const group of MUSCLE_GROUP_ORDER) {
      const items = byGroup.get(group);
      if (!items || (groupFilter && groupFilter !== group)) continue;
      sections.push(
        {
          kind: "header",
          key: `group-${group}`,
          title: t.muscleGroupNames[group],
          count: items.length,
        },
        ...items,
      );
    }

    const groupCounts = MUSCLE_GROUP_ORDER.filter((g) => byGroup.has(g));
    return { sections, groupCounts };
  }, [indexed, createdSet, filters, deferredQuery, groupFilter, t]);


  const handleOpen = useCallback((exerciseId: string) => {
    router.push({
      pathname: "/(tabs)/workouts/exercise-detail",
      params: { exerciseId },
    } as any);
  }, []);

  const handleDelete = useCallback(
    (exercise: Exercise) => {
      Alert.alert(
        t.deleteExerciseQuestion,
        `"${exercise.name}" — ${t.removeFromYourExercises}`,
        [
          { text: t.cancel, style: "cancel" },
          {
            text: t.delete,
            style: "destructive",
            onPress: async () => {
              try {
                const token = await TokenService.get();
                if (!token) {
                  Alert.alert(t.error, t.authRequired);
                  return;
                }
                await deleteExercise(exercise.id, token);
                await loadExercises();
              } catch (err) {
                Alert.alert(
                  t.error,
                  err instanceof Error ? err.message : t.deletionError,
                );
              }
            },
          },
        ],
      );
    },
    [t, loadExercises],
  );

  const handleApplyFilters = useCallback((next: ExerciseFilters) => {
    setFilters(next);
    setFilterVisible(false);
  }, []);

  const closeFilters = useCallback(() => setFilterVisible(false), []);

  const renderItem = useCallback(
    ({ item }: { item: Row }) =>
      item.kind === "header" ? (
        <View className="flex-row items-baseline justify-between bg-background px-1 pb-2 pt-4">
          <Text className="text-xl font-semibold text-ink">{item.title}</Text>
          <Text className="text-sm text-ink-muted">{item.count}</Text>
        </View>
      ) : (
        <ExerciseRow
          exercise={item.exercise}
          canDelete={item.canDelete}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      ),
    [handleOpen, handleDelete],
  );

  const stickyIndices = useMemo(
    () =>
      rows.flatMap((row, index) => (row.kind === "header" ? [index] : [])),
    [rows],
  );
  const chipGroups =
    groupFilter && !groupCounts.includes(groupFilter)
      ? [...groupCounts, groupFilter]
      : groupCounts;

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 px-4">
      {!loading && !error && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="max-h-12 flex-grow-0"
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {[null, ...chipGroups].map((group) => {
            const selected = group === groupFilter;
            return (
              <Pressable
                key={group ?? "all"}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setGroupFilter(group)}
                className={`h-9 justify-center rounded-full px-4 ${
                  selected ? "bg-accent" : "bg-surface"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selected ? "text-on-accent" : "text-ink-light"
                  }`}
                >
                  {group ? t.muscleGroupNames[group] : t.all}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-muted">{t.loadingExercises}</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-danger">{error}</Text>
        </View>
      ) : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-muted">{t.noExerciseFound}</Text>
        </View>
      ) : (
        <FlatList {...chromeScrollProps}
          data={rows}
          stickyHeaderIndices={stickyIndices}
          keyExtractor={(row) => row.key}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottomOffset + 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ExerciseFilterSheet
        visible={filterVisible}
        value={filters}
        onClose={closeFilters}
        onApply={handleApplyFilters}
      />

    </SafeAreaView>
  );
}
