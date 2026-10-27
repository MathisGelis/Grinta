import React, {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { View, Text, FlatList, Alert } from "react-native";
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
import ExerciseCard from "@/components/workout/exercises/ExerciseCard";
import ExerciseFilterSheet, {
  ExerciseFilters,
  NO_FILTERS,
} from "@/components/workout/exercises/ExerciseFilterSheet";

type Row =
  | { kind: "header"; key: string; title: string }
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

  const rows = useMemo<Row[]>(() => {
    const needle = normalizeText(deferredQuery.trim());
    const mine: Row[] = [];
    const shared: Row[] = [];

    for (const { exercise, lowerName } of indexed) {
      if (filters.equipment && exercise.equipment_type !== filters.equipment) continue;
      if (filters.muscle && exercise.primary_muscle !== filters.muscle) continue;
      if (filters.type && exercise.exercise_type !== filters.type) continue;
      if (needle && !lowerName.includes(needle)) continue;

      const canDelete = createdSet.has(exercise.id);
      (canDelete ? mine : shared).push({
        kind: "exercise",
        key: exercise.id,
        exercise,
        canDelete,
      });
    }

    return [
      ...(mine.length > 0
        ? [{ kind: "header", key: "mine", title: t.yourExercises } as Row, ...mine]
        : []),
      ...(shared.length > 0
        ? [{ kind: "header", key: "shared", title: t.sharedExercises } as Row, ...shared]
        : []),
    ];
  }, [indexed, createdSet, filters, deferredQuery, t]);

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
        <Text className="mb-3 pt-1 text-lg font-semibold text-ink">
          {item.title}
        </Text>
      ) : (
        <ExerciseCard
          exercise={item.exercise}
          canDelete={item.canDelete}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      ),
    [handleOpen, handleDelete],
  );

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} className="flex-1 px-4">
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
        <FlatList
          data={rows}
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
