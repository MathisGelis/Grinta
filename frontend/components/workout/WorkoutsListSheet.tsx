import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, Keyboard, Platform, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Modal from "@/components/ui/AppModal";
import Chip from "@/components/ui/Chip";
import Card from "@/components/ui/Card";
import PressableScale from "@/components/ui/PressableScale";
import SegmentedControl from "@/components/ui/SegmentedControl";
import TemplatePicker from "@/components/workout/programmes/TemplatePicker";
import GlassSearchBar from "@/components/GlassSearchBar";
import BottomBlur from "@/components/ui/BottomBlur";
import WorkoutCard from "@/components/workout/card/WorkoutCard";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { difficultyLabel } from "@/i18n/labels";
import { format } from "@/i18n/translations";
import type { SmallProgramm } from "@/services/programms.service";
import type { PlannedWorkout } from "@/services/workouts.service";
import { normalizeText } from "@/utils/text";
import EmptyState from "@/components/ui/EmptyState";

type Sort = "default" | "name" | "count";

type Props = {
  visible: boolean;
  kind: "programmes" | "sessions";
  onClose: () => void;
  programmes: SmallProgramm[];
  workouts: PlannedWorkout[];
  /** Un programme prédéfini vient d'être ajouté : la page doit se recharger. */
  onProgrammeAdded?: () => void;
};

/** Slider de recherche : liste complète des programmes ou des séances, barre de recherche en bas. */
function WorkoutsListSheet({
  visible,
  kind,
  onClose,
  programmes,
  workouts,
  onProgrammeAdded,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<Sort>("default");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [programmeTab, setProgrammeTab] = useState<"mine" | "predefined">("mine");
  const [keyboard, setKeyboard] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const isProgrammes = kind === "programmes";
  const showFilter = !(isProgrammes && programmeTab === "predefined");

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
      setSortBy("default");
      setFiltersOpen(false);
      setProgrammeTab("mine");
    }
  }, [visible]);

  // La barre de recherche flotte sur la liste : l'espace réservé évite qu'elle cache le dernier élément.
  const bottomPad = keyboard ? 6 : Math.max(insets.bottom - 10, 6);
  const barSpace = 48 + bottomPad + 10;

  const needle = normalizeText(deferredQuery.trim());

  const programmeData = useMemo(() => {
    const filtered = needle
      ? programmes.filter((p) => normalizeText(p.title).includes(needle))
      : programmes;
    if (sortBy === "default") return filtered;
    return [...filtered].sort((a, b) =>
      sortBy === "name" ? a.title.localeCompare(b.title) : b.totalDays - a.totalDays,
    );
  }, [programmes, needle, sortBy]);

  const workoutData = useMemo(() => {
    const filtered = needle
      ? workouts.filter((w) => normalizeText(w.title).includes(needle))
      : workouts;
    if (sortBy === "default") return filtered;
    return [...filtered].sort((a, b) =>
      sortBy === "name"
        ? a.title.localeCompare(b.title)
        : (b.totalExercises ?? 0) - (a.totalExercises ?? 0),
    );
  }, [workouts, needle, sortBy]);

  const sorts: { value: Sort; label: string }[] = [
    { value: "default", label: t.sortDefault },
    { value: "name", label: t.sortName },
    { value: "count", label: isProgrammes ? t.sortDayCount : t.sortExerciseCount },
  ];

  const openProgramme = (programme: SmallProgramm) => {
    onClose();
    router.push({
      pathname: "/(tabs)/workouts/programme-detail",
      params: { programmeId: programme.id },
    } as any);
  };

  const empty = (
    <EmptyState
      plain
      icon={isProgrammes ? "calendar-outline" : "barbell-outline"}
      title={t.noResultsLabel}
    />
  );

  const header = (
    <>
      <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-raised" />
      <View className="flex-row items-center justify-between px-5 pb-5">
        <Text className="text-xl font-semibold text-ink">
          {isProgrammes ? t.programmes : t.sessions}
        </Text>
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
      {filtersOpen && showFilter && (
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
    </>
  );

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
        style={{ height: windowHeight * 0.7, marginBottom: keyboard }}
      >
        {header}

        {isProgrammes ? (
          <View className="px-5 pb-3">
            <SegmentedControl<"mine" | "predefined">
              id="programme-sheet-tab"
              value={programmeTab}
              onChange={setProgrammeTab}
              options={[
                { value: "mine", label: t.prgMine },
                { value: "predefined", label: t.prgPredefined },
              ]}
            />
          </View>
        ) : null}

        {isProgrammes && programmeTab === "predefined" ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: barSpace }}
          >
            <TemplatePicker
              query={deferredQuery}
              onUsed={() => {
                onProgrammeAdded?.();
                onClose();
              }}
            />
          </ScrollView>
        ) : isProgrammes ? (
          <FlatList
            data={programmeData}
            keyExtractor={(p) => p.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: barSpace }}
            renderItem={({ item }) => (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => openProgramme(item)}
                className="mb-3"
              >
                <Card tone="surface" size="tile" className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
                    <Ionicons name="calendar-outline" size={18} color={WorkoutTheme.accent.purple} />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-base font-semibold text-ink">
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} className="mt-0.5 text-xs text-ink-muted">
                      {format(t.daysCount, { n: item.totalDays })},{" "}
                      {difficultyLabel(t, item.difficulty).toLowerCase()}
                    </Text>
                  </View>
                </Card>
              </PressableScale>
            )}
            ListEmptyComponent={empty}
          />
        ) : (
          <FlatList
            data={workoutData}
            keyExtractor={(w) => w.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: barSpace }}
            renderItem={({ item }) => (
              <WorkoutCard workout={item} onOpen={onClose} />
            )}
            ListEmptyComponent={empty}
          />
        )}

        <BottomBlur height={barSpace + 20} />
        <View
          className="absolute inset-x-0 bottom-0 px-5"
          style={{ paddingBottom: bottomPad }}
        >
          <GlassSearchBar
            blur
            value={query}
            onChangeText={setQuery}
            placeholder={isProgrammes ? t.searchProgramme : t.searchWorkout}
            onFilter={showFilter ? () => setFiltersOpen((open) => !open) : undefined}
          />
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(WorkoutsListSheet);
