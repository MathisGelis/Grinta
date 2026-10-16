import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Animated,
  FlatList,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import GlassSearchBar from "@/components/GlassSearchBar";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import {
  Exercise,
  deleteExercise,
  getAllExercises,
  getUserCreatedExerciseIds,
} from "@/services/exercises.service";
import { TokenService } from "@/services/token.service";
import { useFocusEffect, router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import Modal from "react-native-modal";

import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import IconButton from "@/components/ui/IconButton";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
export default function ExercisesScreen() {
  const { t } = useTranslation();
  const { keyboardY, bottomOffset } = useKeyboardOffset();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [userCreatedIds, setUserCreatedIds] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadExercises = useCallback(async () => {
    try {
      setError(null);
      const [allExercises, createdIds] = await Promise.all([
        getAllExercises(),
        getUserCreatedExerciseIds(),
      ]);
      setExercises(allExercises);
      setFilteredExercises(allExercises);
      setUserCreatedIds(createdIds);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.loadingError;
      setError(message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadExercises();
    }, [loadExercises]),
  );

  const applyExerciseFilters = (items: Exercise[]) =>
    items.filter((exercise) => {
      const matchesEquipment =
        !selectedEquipment || exercise.equipment_type === selectedEquipment;
      const matchesMuscle =
        !selectedMuscle || exercise.primary_muscle === selectedMuscle;
      const matchesExerciseType =
        !selectedExerciseType ||
        exercise.exercise_type === selectedExerciseType;

      return matchesEquipment && matchesMuscle && matchesExerciseType;
    });

  const handleSearchResults = (filteredNames: string[]) => {
    const baseFiltered = applyExerciseFilters(exercises);
    const filtered = baseFiltered.filter((e) => filteredNames.includes(e.name));
    setFilteredExercises(filtered);
  };

  const openFilterModal = () => setIsFilterModalVisible(true);

  const applyFilters = () => {
    setFilteredExercises(applyExerciseFilters(exercises));
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    setSelectedEquipment(null);
    setSelectedMuscle(null);
    setSelectedExerciseType(null);
    setFilteredExercises(exercises);
    setIsFilterModalVisible(false);
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
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
              const message =
                err instanceof Error ? err.message : t.deletionError;
              Alert.alert(t.error, message);
            }
          },
        },
      ],
    );
  };

  const userExercises = filteredExercises.filter((exercise) =>
    userCreatedIds.includes(exercise.id),
  );
  const sharedExercises = filteredExercises.filter(
    (exercise) => !userCreatedIds.includes(exercise.id),
  );
  const sections = [
    ...(userExercises.length > 0
      ? [
          {
            title: t.yourExercises,
            items: userExercises,
            canDelete: true,
          },
        ]
      : []),
    ...(sharedExercises.length > 0
      ? [
          {
            title: t.sharedExercises,
            items: sharedExercises,
            canDelete: false,
          },
        ]
      : []),
  ];

  const renderExerciseCard = (item: Exercise, canDelete: boolean) => {
    return (
      <View className="mb-3 rounded-card bg-surface p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs text-ink-muted">
              {t.exerciseTypeNames[item.exercise_type] ??
                item.exercise_type.replace(/_/g, " ")}
            </Text>
            <Text className="mt-1 text-xl font-semibold text-ink">
              {item.name}
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="h-8 justify-center rounded-full bg-accent-tint px-3">
                <Text className="text-xs font-medium text-accent-text">
                  {t.muscleNames[item.primary_muscle] ??
                    item.primary_muscle.replace(/_/g, " ")}
                </Text>
              </View>
              <View className="h-8 justify-center rounded-full bg-raised px-3">
                <Text className="text-xs font-medium text-ink-light">
                  {t.equipmentNames[item.equipment_type] ??
                    item.equipment_type.replace(/_/g, " ")}
                </Text>
              </View>
            </View>
          </View>
          {canDelete && (
            <PressableScale
              onPress={() => handleDeleteExercise(item)}
              accessibilityRole="button"
              accessibilityLabel={t.deleteExercise}
              className="h-10 w-10 items-center justify-center rounded-full bg-danger-tint"
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={WorkoutTheme.status.danger}
              />
            </PressableScale>
          )}
        </View>
      </View>
    );
  };

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
      ) : filteredExercises.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-muted">{t.noExerciseFound}</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          contentContainerStyle={{ paddingBottom: bottomOffset + 80 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="pb-4">
              <Text className="mb-3 text-lg font-semibold text-ink">
                {item.title}
              </Text>
              {item.items.map((exercise: Exercise) => (
                <View key={exercise.id}>
                  {renderExerciseCard(exercise, item.canDelete)}
                </View>
              ))}
            </View>
          )}
        />
      )}
      <Modal
        isVisible={isFilterModalVisible}
        onBackdropPress={() => setIsFilterModalVisible(false)}
        onSwipeComplete={() => setIsFilterModalVisible(false)}
        swipeDirection="down"
        propagateSwipe
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="rounded-t-hero bg-surface p-5 pb-8">
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-raised" />
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-ink">
              {t.filterExercises}
            </Text>
            <IconButton
              icon="close"
              label={t.closeLabel}
              onPress={() => setIsFilterModalVisible(false)}
            />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            scrollEnabled
            className="max-h-[70%]"
          >
            <Text className="mb-3 text-base font-semibold text-ink">
              {t.equipment}
            </Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {Object.entries(t.equipmentNames).map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  active={selectedEquipment === key}
                  onPress={() =>
                    setSelectedEquipment(selectedEquipment === key ? null : key)
                  }
                />
              ))}
            </View>

            <Text className="mb-3 text-base font-semibold text-ink">
              {t.primaryMuscle}
            </Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {Object.entries(t.muscleNames).map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  active={selectedMuscle === key}
                  onPress={() =>
                    setSelectedMuscle(selectedMuscle === key ? null : key)
                  }
                />
              ))}
            </View>

            <Text className="mb-3 text-base font-semibold text-ink">
              {t.exerciseType}
            </Text>
            <View className="mb-2 flex-row flex-wrap gap-2">
              {Object.entries(t.exerciseTypeNames).map(([key, label]) => (
                  <Chip
                    key={key}
                    label={label}
                    active={selectedExerciseType === key}
                    onPress={() =>
                      setSelectedExerciseType(
                        selectedExerciseType === key ? null : key,
                      )
                    }
                  />
                ))}
            </View>
          </ScrollView>
          <View className="mt-4 flex-row gap-3">
            <Button
              className="flex-1"
              variant="secondary"
              label={t.reset}
              onPress={resetFilters}
            />
            <Button className="flex-1" label={t.apply} onPress={applyFilters} />
          </View>
        </View>
      </Modal>
      <Animated.View
        className="absolute left-0 right-0 px-5"
        style={{
          bottom: bottomOffset + 12,
          transform: [{ translateY: keyboardY }],
        }}
      >
        <GlassSearchBar
          items={exercises.map((e) => e.name)}
          onResults={handleSearchResults}
          onAdd={() => router.push("/(tabs)/workouts/create/exercise")}
          placeholder={t.searchExercise}
          filter={openFilterModal}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
