import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Modal from "@/components/ui/AppModal";
import PressableScale from "@/components/ui/PressableScale";
import GlassSearchBar from "@/components/GlassSearchBar";
import BottomBlur from "@/components/ui/BottomBlur";
import ExerciseRow from "@/components/workout/exercises/ExerciseRow";
import ExerciseFilterSheet, {
  ExerciseFilters,
  NO_FILTERS,
} from "@/components/workout/exercises/ExerciseFilterSheet";
import { buildExerciseRows, indexExercises, type ExerciseListRow } from "@/components/workout/exercises/exerciseRows";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import type { Exercise } from "@/services/exercises.service";
import { normalizeText } from "@/utils/text";
import EmptyState from "@/components/ui/EmptyState";

type Props = {
  visible: boolean;
  onClose: () => void;
  exercises: Exercise[];
  createdIds: Set<string>;
  onOpen: (exerciseId: string) => void;
  onDelete: (exercise: Exercise) => void;
};

/** Slider de recherche : liste complète des exercices, barre de recherche et filtres en bas. */
function ExercisesListSheet({ visible, onClose, exercises, createdIds, onOpen, onDelete }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ExerciseFilters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(0);
  const deferredQuery = useDeferredValue(query);

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

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setFilters(NO_FILTERS);
      setFiltersOpen(false);
    }
  }, [visible]);

  const indexed = useMemo(() => indexExercises(exercises), [exercises]);
  // Liste simple : pas de titres de groupe dans le slider.
  const rows = useMemo(
    () =>
      buildExerciseRows(indexed, createdIds, filters, normalizeText(deferredQuery.trim()), t).filter(
        (row): row is Extract<ExerciseListRow, { kind: "exercise" }> => row.kind === "exercise",
      ),
    [indexed, createdIds, filters, deferredQuery, t],
  );

  // La barre de recherche flotte sur la liste : l'espace réservé en bas évite qu'elle cache le dernier exercice.
  const bottomPad = keyboard ? 6 : Math.max(insets.bottom - 10, 6);
  const barSpace = 48 + bottomPad + 10;

  const open = (exerciseId: string) => {
    onClose();
    onOpen(exerciseId);
  };

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
          <Text className="text-xl font-semibold text-ink">{t.exercises}</Text>
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

        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: barSpace, flexGrow: 1 }}
          renderItem={({ item }) => (
            <ExerciseRow
              exercise={item.exercise}
              canDelete={item.canDelete}
              onOpen={open}
              onDelete={onDelete}
            />
          )}
          ListEmptyComponent={
            <EmptyState plain icon="barbell-outline" title={t.noExerciseFound} />
          }
        />

        <BottomBlur height={barSpace + 20} />
        <View
          className="absolute inset-x-0 bottom-0 px-5"
          style={{ paddingBottom: bottomPad }}
        >
          <GlassSearchBar
            blur
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchExercise}
            onFilter={() => setFiltersOpen(true)}
          />
        </View>

        <ExerciseFilterSheet
          visible={filtersOpen}
          value={filters}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setFiltersOpen(false);
          }}
        />
      </View>
    </Modal>
  );
}

export default React.memo(ExercisesListSheet);
