import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, Platform, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Modal from "@/components/ui/AppModal";
import Chip from "@/components/ui/Chip";
import IconButton from "@/components/ui/IconButton";
import PressableScale from "@/components/ui/PressableScale";
import GlassSearchBar from "@/components/GlassSearchBar";
import { WorkoutSort } from "@/components/workout/WorkoutSortSheet";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { PlannedWorkout } from "@/services/workouts.service";
import { normalizeText } from "@/utils/text";

type Props = {
  visible: boolean;
  workouts: PlannedWorkout[];
  onClose: () => void;
  onSelect: (workout: PlannedWorkout) => void;
  onCreate: () => void;
};

function WorkoutPickerSheet({ visible, workouts, onClose, onSelect, onCreate }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<WorkoutSort>("default");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const { height: windowHeight } = useWindowDimensions();
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

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setFiltersOpen(false);
    }
  }, [visible]);

  const data = useMemo(() => {
    const needle = normalizeText(deferredQuery.trim());
    const filtered = needle
      ? workouts.filter((w) => normalizeText(w.title).includes(needle))
      : workouts;
    if (sortBy === "default") return filtered;
    return [...filtered].sort((a, b) =>
      sortBy === "name"
        ? a.title.localeCompare(b.title)
        : (b.totalExercises ?? 0) - (a.totalExercises ?? 0),
    );
  }, [workouts, deferredQuery, sortBy]);

  const sorts: { value: WorkoutSort; label: string }[] = [
    { value: "default", label: t.sortDefault },
    { value: "name", label: t.sortName },
    { value: "exercises", label: t.sortExerciseCount },
  ];

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
          className="rounded-t-hero bg-surface pt-3"
          style={{ height: windowHeight * 0.85, marginBottom: keyboard }}
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-raised" />
          <View className="flex-row items-center justify-between px-5 pb-3">
            <Text className="text-xl font-semibold text-ink">{t.chooseWorkout}</Text>
            <IconButton icon="close" label={t.closeLabel} onPress={onClose} />
          </View>

          {filtersOpen && (
            <View className="flex-row flex-wrap gap-2 px-5 pb-3">
              {sorts.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  active={sortBy === s.value}
                  onPress={() => setSortBy(s.value)}
                />
              ))}
            </View>
          )}

          <FlatList
            data={data}
            keyExtractor={(w) => w.id}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, flexGrow: 1 }}
            renderItem={({ item }) => (
              <PressableScale
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                className="mb-3 rounded-card bg-raised p-4"
              >
                <Text className="text-base font-semibold text-ink">{item.title}</Text>
                <Text className="mt-1 text-xs text-ink-soft" numberOfLines={2}>
                  {item.description || t.noDescription}
                </Text>
                <Text className="mt-2 text-[11px] text-accent-text">
                  {format(t.exercisesCount, { n: item.totalExercises })}
                </Text>
              </PressableScale>
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-10">
                <Ionicons name="barbell-outline" size={40} color={WorkoutTheme.text.tertiary} />
                <Text className="mt-4 text-sm text-ink-soft">
                  {workouts.length === 0 ? t.noWorkoutAvailable : t.noResultsLabel}
                </Text>
                {workouts.length === 0 && (
                  <Text className="mt-1 text-xs text-ink-soft">{t.createWorkoutFirst}</Text>
                )}
              </View>
            }
          />

          <View className="px-5 pt-2" style={{ paddingBottom: keyboard ? 12 : Math.max(insets.bottom, 12) }}>
            <GlassSearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t.searchWorkout}
              onFilter={() => setFiltersOpen((open) => !open)}
              onAdd={onCreate}
            />
          </View>
        </View>
    </Modal>
  );
}

export default React.memo(WorkoutPickerSheet);
