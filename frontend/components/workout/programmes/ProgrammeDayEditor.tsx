import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { armChrome, onChromeScroll } from "@/components/ui/chromeScroll";
import { PlannedWorkout } from "@/services/workouts.service";
import { ProgrammeDay } from "@/services/programms.service";

import { WorkoutTheme } from "@/constants/Colors";
import Modal from "@/components/ui/AppModal";
import PressableScale from "@/components/ui/PressableScale";
import IconButton from "@/components/ui/IconButton";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

/** Hauteur fixe d'une ligne : le calcul des positions pendant le glisser n'a besoin d'aucune mesure. */
/** Nombre maximal de jours d'un programme (B-03). */
const MAX_PROGRAMME_DAYS = 84;

const ROW_HEIGHT = 64;
const ROW_GAP = 8;
const PITCH = ROW_HEIGHT + ROW_GAP;
const SPRING = { damping: 22, stiffness: 260, mass: 0.7 };

interface ProgrammeDayEditorProps {
  days: ProgrammeDay[];
  onChangeDays: (days: ProgrammeDay[]) => void;
  availableWorkouts: PlannedWorkout[];
  /** Mode modification : sinon la liste est en lecture seule (pas de glisser, ajout ni suppression). */
  editing?: boolean;
  /** Jour du programme suivi correspondant à aujourd'hui. */
  currentDay?: number;
  /** Contenu affiché au-dessus des jours : l'éditeur est la liste principale de la page. */
  header?: React.ReactNode;
  /** Contenu affiché sous les jours. */
  footer?: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

type Positions = Record<string, number>;

type RowProps = {
  id: string;
  index: number;
  count: number;
  positions: SharedValue<Positions>;
  activeId: SharedValue<string>;
  startY: SharedValue<number>;
  dragY: SharedValue<number>;
  enabled: boolean;
  onDragStart: () => void;
  onDragEnd: (orderedIds: string[]) => void;
  children: React.ReactNode;
};

/** Ligne positionnée en absolu : se déplace avec le doigt, les autres s'écartent avec un ressort. */
function DraggableRow({
  id,
  index,
  count,
  positions,
  activeId,
  startY,
  dragY,
  enabled,
  onDragStart,
  onDragEnd,
  children,
}: RowProps) {
  const gesture = Gesture.Pan()
    .enabled(enabled)
    .activateAfterLongPress(180)
    .onStart(() => {
      const current = positions.get()[id] ?? index;
      activeId.set(id);
      startY.set(current * PITCH);
      dragY.set(0);
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      dragY.set(event.translationY);
      const map = positions.get();
      const from = map[id] ?? index;
      const target = Math.max(
        0,
        Math.min(count - 1, Math.round((startY.get() + event.translationY) / PITCH)),
      );
      if (target === from) return;
      const next: Positions = {};
      for (const key in map) {
        const position = map[key];
        if (key === id) next[key] = target;
        else if (from < target && position > from && position <= target) next[key] = position - 1;
        else if (from > target && position >= target && position < from) next[key] = position + 1;
        else next[key] = position;
      }
      positions.set(next);
    })
    .onFinalize(() => {
      if (activeId.get() !== id) return;
      const map = positions.get();
      const final = (map[id] ?? index) * PITCH;
      // Le doigt est levé : la ligne glisse jusqu'à son emplacement final.
      startY.set(final);
      dragY.set(0);
      activeId.set("");
      const ordered = Object.keys(map).sort((a, b) => map[a] - map[b]);
      runOnJS(onDragEnd)(ordered);
    });

  const style = useAnimatedStyle(() => {
    const active = activeId.get() === id;
    const slot = (positions.get()[id] ?? index) * PITCH;
    return {
      zIndex: active ? 10 : 0,
      transform: [
        { translateY: active
            ? Math.max(0, Math.min((count - 1) * PITCH, startY.get() + dragY.get()))
            : withSpring(slot, SPRING) },
        { scale: withSpring(active ? 1.02 : 1, SPRING) },
      ],
    };
  });

  const borderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeId.get() === id ? 1 : 0, { duration: 120 }),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          { position: "absolute", left: 0, right: 0, top: 0, height: ROW_HEIGHT },
          style,
        ]}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              borderRadius: 22,
              borderWidth: 0.5,
              borderColor: WorkoutTheme.accent.purple,
            },
            borderStyle,
          ]}
        />
      </Animated.View>
    </GestureDetector>
  );
}

export default function ProgrammeDayEditor({
  days,
  onChangeDays,
  availableWorkouts,
  editing = true,
  currentDay,
  header,
  footer,
  contentContainerStyle,
}: ProgrammeDayEditorProps) {
  const { t } = useTranslation();
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Clé stable par jour : dayNumber change à chaque réordonnancement.
  const ids = useRef(new WeakMap<object, string>());
  const nextId = useRef(0);
  const idOf = (item: ProgrammeDay) => {
    let id = ids.current.get(item);
    if (!id) {
      id = `day-${nextId.current++}`;
      ids.current.set(item, id);
    }
    return id;
  };
  const renumber = (items: ProgrammeDay[]) =>
    items.map((item, index) => {
      const next = { ...item, dayNumber: index + 1 };
      ids.current.set(next, idOf(item));
      return next;
    });

  const dayIds = days.map(idOf);
  const orderKey = dayIds.join("|");

  const positions = useSharedValue<Positions>({});
  const activeId = useSharedValue("");
  const startY = useSharedValue(0);
  const dragY = useSharedValue(0);

  // Les positions suivent la liste à chaque ajout, suppression ou réordonnancement validé.
  useEffect(() => {
    const map: Positions = {};
    orderKey.split("|").forEach((id, index) => {
      if (id) map[id] = index;
    });
    positions.set(map);
  }, [orderKey, positions]);

  const handleDragStart = useCallback(() => {
    setDragging(true);
    if (process.env.EXPO_OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragEnd = useCallback(
    (orderedIds: string[]) => {
      setDragging(false);
      const byId = new Map(days.map((day) => [idOf(day), day]));
      const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as ProgrammeDay[];
      if (reordered.length !== days.length) return;
      if (reordered.every((day, index) => day === days[index])) return;
      onChangeDays(renumber(reordered));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, onChangeDays],
  );

  const addWorkoutDay = useCallback(
    (workout: PlannedWorkout) => {
      if (days.length >= MAX_PROGRAMME_DAYS) {
        toast.info(t.maxProgrammeDays);
        setShowWorkoutPicker(false);
        return;
      }
      onChangeDays([
        ...days,
        {
          dayNumber: days.length + 1,
          workout: {
            id: workout.id,
            title: workout.title,
            description: workout.description,
          },
        },
      ]);
      setShowWorkoutPicker(false);
    },
    [days, onChangeDays, t],
  );

  const addRestDay = useCallback(() => {
    if (days.length >= MAX_PROGRAMME_DAYS) {
      toast.info(t.maxProgrammeDays);
      return;
    }
    onChangeDays([
      ...days,
      {
        dayNumber: days.length + 1,
        workout: null,
      },
    ]);
  }, [days, onChangeDays, t]);

  const removeDay = (dayNumber: number) => {
    onChangeDays(renumber(days.filter((item) => item.dayNumber !== dayNumber)));
  };

  const onScroll = useMemo(
    () => (event: NativeSyntheticEvent<NativeScrollEvent>) =>
      onChromeScroll(event.nativeEvent.contentOffset.y),
    [],
  );

  const renderRow = (item: ProgrammeDay) => (
    <View
      className="flex-1 flex-row items-center justify-between rounded-tile bg-surface px-5"
      style={{ height: ROW_HEIGHT }}
    >
      <View className="mr-2 flex-1 flex-row items-center gap-3">
        {editing ? (
          <Ionicons
            name="reorder-three-outline"
            size={22}
            color={WorkoutTheme.text.light}
          />
        ) : null}
        <View className="flex-1">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>
            {format(t.dayN, { n: item.dayNumber })} · {item.workout?.title ?? t.restDay}
          </Text>
          <Text
            className={`mt-0.5 text-xs ${item.dayNumber === currentDay ? "font-semibold text-accent-light" : "text-ink-muted"}`}
          >
            {item.dayNumber === currentDay ? t.prgToday : item.workout ? t.scheduledWorkout : t.restDay}
          </Text>
        </View>
      </View>
      {editing ? (
        <PressableScale
          onPress={() => removeDay(item.dayNumber)}
          accessibilityRole="button"
          accessibilityLabel={t.removeDay}
          halo={false}
          hitSlop={12}
        >
          <Ionicons name="trash-outline" size={22} color={WorkoutTheme.status.danger} />
        </PressableScale>
      ) : item.workout ? (
        <PressableScale
          onPress={() =>
            router.push({
              pathname: "/(tabs)/workouts/workout-detail",
              params: { workoutId: item.workout!.id, title: item.workout!.title },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={item.workout.title}
          halo={false}
          hitSlop={12}
        >
          <Ionicons name="information-circle-outline" size={22} color={WorkoutTheme.text.primary} />
        </PressableScale>
      ) : (
        <MaterialCommunityIcons
          name="sleep"
          size={22}
          color={WorkoutTheme.accent.purple}
          accessibilityLabel={t.restDay}
        />
      )}
    </View>
  );

  const listHeader = (
    <View style={{ zIndex: 10 }}>
      {header}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-ink">
          {t.programmeDaysTitle}
        </Text>
        {editing ? (
        <View className="flex-row items-center gap-2">
          <IconButton
            icon="barbell-outline"
            size={40}
            label={t.addWorkoutDay}
            onPress={() => setShowWorkoutPicker(true)}
          />
          <IconButton
            icon="bed-outline"
            size={40}
            label={t.addRestDay}
            onPress={addRestDay}
          />
        </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        scrollEnabled={!dragging}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={armChrome}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={contentContainerStyle}
      >
        {listHeader}
        {days.length === 0 ? (
          <EmptyState plain icon="calendar-outline" title={t.noDaysYet} />
        ) : (
          <View style={{ height: days.length * PITCH - ROW_GAP }}>
            {days.map((item, index) => (
              <DraggableRow
                key={dayIds[index]}
                id={dayIds[index]}
                index={index}
                count={days.length}
                positions={positions}
                activeId={activeId}
                startY={startY}
                dragY={dragY}
                enabled={editing}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {renderRow(item)}
              </DraggableRow>
            ))}
          </View>
        )}
        <View>{footer}</View>
      </ScrollView>

      <Modal
        isVisible={showWorkoutPicker}
        onBackdropPress={() => setShowWorkoutPicker(false)}
        onSwipeComplete={() => setShowWorkoutPicker(false)}
        swipeDirection="down"
        style={{ justifyContent: "flex-end" }}
      >
        <View className="rounded-t-hero bg-surface p-5 pb-8">
            <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-raised" />
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-semibold text-ink">
                {t.chooseWorkout}
              </Text>
              <IconButton
                icon="close"
                label={t.closeLabel}
                onPress={() => setShowWorkoutPicker(false)}
              />
            </View>
            <ScrollView
              className="max-h-[320px]"
              showsVerticalScrollIndicator={false}
            >
              {availableWorkouts.length === 0 ? (
                <EmptyState plain icon="barbell-outline" title={t.noWorkoutAvailable} message={t.createWorkoutFirst} />
              ) : (
                availableWorkouts.map((workout) => (
                  <PressableScale
                    key={workout.id}
                    onPress={() => addWorkoutDay(workout)}
                    className="mb-3 rounded-card bg-raised p-4"
                  >
                    <Text className="text-base font-semibold text-ink">
                      {workout.title}
                    </Text>
                    <Text className="mt-1 text-xs text-ink-soft">
                      {workout.description || t.noDescription}
                    </Text>
                    <Text className="mt-2 text-[11px] text-accent-text">
                      {format(t.exercisesCount, { n: workout.totalExercises })}
                    </Text>
                  </PressableScale>
                ))
              )}
            </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
