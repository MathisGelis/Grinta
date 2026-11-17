import React, { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import {
  View,
  Text,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { getAllExercises, Exercise } from "@/services/exercises.service";
import Modal from "@/components/ui/AppModal";
import PressableScale from "@/components/ui/PressableScale";
import GlassSearchBar from "@/components/GlassSearchBar";
import BottomBlur from "@/components/ui/BottomBlur";
import { useTranslation } from "@/contexts/LanguageContext";
import { normalizeText } from "@/utils/text";
import { ExerciseListSkeleton } from "@/components/ui/skeletons";
import EmptyState from "@/components/ui/EmptyState";

interface ExerciseSearchProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  existingExerciseIds?: string[];
}

/** Slider d'ajout d'exercice : même design que la liste des exercices, se ferme en glissant vers le bas. */
export default function ExerciseSearch({
  visible,
  onClose,
  onSelectExercise,
  existingExerciseIds = [],
}: ExerciseSearchProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [keyboard, setKeyboard] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboard(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboard(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const loadExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      setAvailableExercises(await getAllExercises());
    } catch (error) {
      Alert.alert(t.error, t.cannotLoadExercises);
      console.error("Erreur:", error);
    } finally {
      setLoadingExercises(false);
    }
  }, [t]);

  useEffect(() => {
    if (visible && availableExercises.length === 0) {
      loadExercises();
    }
  }, [visible, availableExercises.length, loadExercises]);

  useEffect(() => {
    if (!visible) setSearchQuery("");
  }, [visible]);

  const filteredExercises = useMemo(() => {
    const q = normalizeText(deferredQuery.trim());
    return q
      ? availableExercises.filter((ex) => normalizeText(ex.name).includes(q))
      : availableExercises;
  }, [availableExercises, deferredQuery]);

  const handleSelect = (exercise: Exercise) => {
    onSelectExercise(exercise);
    onClose();
  };

  // La barre de recherche flotte sur la liste : l'espace réservé évite qu'elle cache le dernier exercice.
  const bottomPad = keyboard ? 6 : Math.max(insets.bottom - 10, 6);
  const barSpace = 48 + bottomPad + 10;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      animationIn="slideInUp"
      style={{ justifyContent: "flex-end", margin: 0 }}
    >
      <View
        className="rounded-t-hero bg-background pt-3"
        style={{ height: windowHeight * 0.85, marginBottom: keyboard }}
      >
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-raised" />
        <View className="flex-row items-center justify-between px-5 pb-5">
          <Text className="text-xl font-semibold text-ink">{t.addExerciseTitle}</Text>
          <PressableScale
            onPress={onClose}
            halo={false}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t.closeLabel}
          >
            <Ionicons name="close" size={26} color={WorkoutTheme.text.primary} />
          </PressableScale>
        </View>

        {loadingExercises ? (
          <View className="flex-1 px-4 pt-2">
            <ExerciseListSkeleton count={8} />
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: barSpace, flexGrow: 1 }}
            renderItem={({ item }) => {
              const isDuplicate = existingExerciseIds.includes(item.id);
              return (
                <PressableScale
                  onPress={() =>
                    isDuplicate
                      ? Alert.alert(t.duplicateExercise, `"${item.name}" ${t.alreadyAdded}`)
                      : handleSelect(item)
                  }
                  className={`mb-2 flex-row items-center justify-between rounded-tile bg-surface p-4 ${isDuplicate ? "opacity-60" : ""}`}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-ink">{item.name}</Text>
                    <Text className="mt-0.5 text-xs capitalize text-ink-muted">
                      {t.muscleNames[item.primary_muscle] ??
                        item.primary_muscle.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <Ionicons
                    name={isDuplicate ? "checkmark-circle" : "add-circle"}
                    size={24}
                    color={
                      isDuplicate ? WorkoutTheme.status.success : WorkoutTheme.accent.purple
                    }
                  />
                </PressableScale>
              );
            }}
            ListEmptyComponent={
              <EmptyState plain icon="barbell-outline" title={t.noExerciseFound} />
            }
          />
        )}

        <BottomBlur height={barSpace + 20} />
        <View className="absolute inset-x-0 bottom-0 px-5" style={{ paddingBottom: bottomPad }}>
          <GlassSearchBar
            blur
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.searchExercise}
          />
        </View>
      </View>
    </Modal>
  );
}
