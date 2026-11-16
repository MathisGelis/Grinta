import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { WorkoutTheme } from "@/constants/Colors";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, Text, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomOffset } from "@/hooks/useKeyboardOffset";
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
import IconButton from "@/components/ui/IconButton";
import { WorkoutsNavBar } from "@/components/workout/WorkoutsNavBar";
import ExerciseRow from "@/components/workout/exercises/ExerciseRow";
import ExercisesListSheet from "@/components/workout/exercises/ExercisesListSheet";
import { buildExerciseRows, indexExercises, type ExerciseListRow } from "@/components/workout/exercises/exerciseRows";


type Row = ExerciseListRow;

export default function ExercisesScreen() {
  const { t } = useTranslation();
  const bottomOffset = useBottomOffset();
  const [exercises, setExercises] = useState<Exercise[]>(
    () => peekExercises() ?? [],
  );
  const [userCreatedIds, setUserCreatedIds] = useState<string[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const openSheet = useCallback(() => setSheetVisible(true), []);
  const closeSheet = useCallback(() => setSheetVisible(false), []);
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

  const indexed = useMemo(() => indexExercises(exercises), [exercises]);
  const createdSet = useMemo(() => new Set(userCreatedIds), [userCreatedIds]);
  const rows = useMemo(
    () => buildExerciseRows(indexed, createdSet, { equipment: null, muscle: null, type: null }, "", t),
    [indexed, createdSet, t],
  );

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

  // La barre fixe affiche le groupe de la première ligne visible ; les titres restent dans la liste.
  const { sectionOf, counts } = useMemo(() => {
    const sectionOf: string[] = [];
    const counts = new Map<string, number>();
    let current = "";
    for (const row of rows) {
      if (row.kind === "header") {
        current = row.title;
        counts.set(row.title, row.count);
      }
      sectionOf.push(current);
    }
    return { sectionOf, counts };
  }, [rows]);

  const sectionOfRef = useRef(sectionOf);
  sectionOfRef.current = sectionOf;
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index?: number | null; isViewable: boolean }[] }) => {
      const first = viewableItems
        .filter((v) => v.isViewable && v.index != null)
        .reduce<number | null>((min, v) => (min === null || v.index! < min ? v.index! : min), null);
      if (first !== null) setCurrentSection(sectionOfRef.current[first] ?? null);
    },
  ).current;

  const title = (currentSection && counts.has(currentSection) ? currentSection : sectionOf[0]) ?? t.exercises;

  const renderItem = useCallback(
    ({ item, index }: { item: Row; index: number }) =>
      item.kind === "header" ? (
        index === 0 ? null : (
        <View
          className="flex-row items-baseline justify-between px-1 pb-2 pt-4"
        >
          <Text className="text-xl font-semibold text-ink">{item.title}</Text>
          <Text className="text-sm text-ink-muted">{item.count}</Text>
        </View>
        )
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

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 px-4">
      <View className="-mx-4">
        <WorkoutsNavBar compact />
      </View>
      <View className="flex-row items-center justify-between px-1 pb-4">
        <Text className="flex-1 text-xl font-semibold text-ink" numberOfLines={1}>
          {title}
        </Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-sm text-ink-muted">{counts.get(title) ?? 0}</Text>
          <IconButton
            icon="add"
            size={40}
            variant="accent"
            label={t.createExercise}
            onPress={() => router.push("/(tabs)/workouts/create/exercise" as any)}
          />
          <IconButton icon="search-outline" size={40} label={t.searchLabel} onPress={openSheet} />
        </View>
      </View>
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
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
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

      <ExercisesListSheet
        visible={sheetVisible}
        onClose={closeSheet}
        exercises={exercises}
        createdIds={createdSet}
        onOpen={handleOpen}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}
