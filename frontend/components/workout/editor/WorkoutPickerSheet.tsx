import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import Reanimated from "react-native-reanimated";
import { useKeyboardSheet } from "@/hooks/useKeyboardOffset";
import { FlatList, Text, View, useWindowDimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import Modal from "@/components/ui/AppModal";
import PressableScale from "@/components/ui/PressableScale";
import GlassSearchBar from "@/components/GlassSearchBar";
import BottomBlur from "@/components/ui/BottomBlur";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { PlannedWorkout } from "@/services/workouts.service";
import { normalizeText } from "@/utils/text";
import EmptyState from "@/components/ui/EmptyState";

type Props = {
  visible: boolean;
  workouts: PlannedWorkout[];
  onClose: () => void;
  onSelect: (workout: PlannedWorkout) => void;
};

function WorkoutPickerSheet({ visible, workouts, onClose, onSelect }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const { height: windowHeight } = useWindowDimensions();
  const { keyboard, sheetStyle } = useKeyboardSheet();

  useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);

  const data = useMemo(() => {
    const needle = normalizeText(deferredQuery.trim());
    return needle ? workouts.filter((w) => normalizeText(w.title).includes(needle)) : workouts;
  }, [workouts, deferredQuery]);

  // La barre de recherche flotte sur la liste : l'espace réservé évite qu'elle cache la dernière séance.
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
      <Reanimated.View
        className="rounded-t-hero bg-background pt-3"
        style={[{ height: windowHeight * 0.85 }, sheetStyle]}
      >
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-raised" />
        <View className="flex-row items-center justify-between px-5 pb-5">
          <Text className="text-xl font-semibold text-ink">{t.chooseWorkout}</Text>
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
          data={data}
          keyExtractor={(w) => w.id}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: barSpace, flexGrow: 1 }}
          renderItem={({ item }) => (
            <PressableScale
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              className="mb-2 rounded-tile bg-surface p-4"
            >
              <Text className="text-base font-semibold text-ink">{item.title}</Text>
              <Text className="mt-0.5 text-xs text-ink-muted" numberOfLines={2}>
                {item.description || t.noDescription}
              </Text>
              <Text className="mt-2 text-[11px] text-accent-text">
                {format(t.exercisesCount, { n: item.totalExercises })}
              </Text>
            </PressableScale>
          )}
          ListEmptyComponent={
            <EmptyState
              plain
              icon="barbell-outline"
              title={workouts.length === 0 ? t.noWorkoutAvailable : t.noResultsLabel}
              message={workouts.length === 0 ? t.createWorkoutFirst : undefined}
            />
          }
        />

        <BottomBlur height={barSpace + 20} />
        <View className="absolute inset-x-0 bottom-0 px-5" style={{ paddingBottom: bottomPad }}>
          <GlassSearchBar
            blur
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchWorkout}
          />
        </View>
      </Reanimated.View>
    </Modal>
  );
}

export default React.memo(WorkoutPickerSheet);
