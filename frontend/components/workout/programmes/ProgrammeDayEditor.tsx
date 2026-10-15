import React, { useCallback, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { PlannedWorkout } from "@/services/workouts.service";
import { ProgrammeDay } from "@/services/programms.service";

import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import IconButton from "@/components/ui/IconButton";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
interface ProgrammeDayEditorProps {
  days: ProgrammeDay[];
  onChangeDays: (days: ProgrammeDay[]) => void;
  availableWorkouts: PlannedWorkout[];
}

export default function ProgrammeDayEditor({
  days,
  onChangeDays,
  availableWorkouts,
}: ProgrammeDayEditorProps) {
  const { t } = useTranslation();
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);

  const addWorkoutDay = useCallback(
    (workout: PlannedWorkout) => {
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
    [days, onChangeDays],
  );

  const addRestDay = useCallback(() => {
    onChangeDays([
      ...days,
      {
        dayNumber: days.length + 1,
        workout: null,
      },
    ]);
  }, [days, onChangeDays]);

  const removeDay = useCallback(
    (dayNumber: number) => {
      onChangeDays(
        days
          .filter((item) => item.dayNumber !== dayNumber)
          .map((item, index) => ({ ...item, dayNumber: index + 1 })),
      );
    },
    [days, onChangeDays],
  );

  const renderDayItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ProgrammeDay>) => (
    <PressableScale
      onLongPress={drag}
      className={`mb-2 rounded-tile border p-3 ${isActive ? "border-accent bg-raised" : "border-transparent bg-surface"}`}
    >
      <View className="w-full flex-row items-center justify-between">
        <View className="mr-2 flex-1 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-raised">
            <Ionicons
              name="reorder-three-outline"
              size={18}
              color={WorkoutTheme.text.light}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-semibold text-ink"
              numberOfLines={1}
            >
              {format(t.dayN, { n: item.dayNumber })} · {item.workout?.title ?? t.restDay}
            </Text>
            <Text className="mt-0.5 text-xs text-ink-muted">
              {item.workout ? t.scheduledWorkout : t.restDay}
            </Text>
          </View>
        </View>
        <PressableScale
          onPress={() => removeDay(item.dayNumber)}
          accessibilityRole="button"
          accessibilityLabel={t.removeDay}
          className="h-10 w-10 items-center justify-center rounded-full bg-danger-tint"
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={WorkoutTheme.status.danger}
          />
        </PressableScale>
      </View>
    </PressableScale>
  );

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-ink">
          {t.programmeDaysTitle}
        </Text>
      </View>
      <View className="mb-3 flex-row gap-2">
        <PressableScale
          onPress={() => setShowWorkoutPicker(true)}
          accessibilityRole="button"
          className="h-10 flex-row items-center gap-1.5 rounded-full bg-accent px-4"
        >
          <Ionicons name="add" size={18} color={WorkoutTheme.text.primary} />
          <Text className="text-sm font-semibold text-ink">{t.addWorkoutDay}</Text>
        </PressableScale>
        <PressableScale
          onPress={addRestDay}
          accessibilityRole="button"
          className="h-10 flex-row items-center gap-1.5 rounded-full bg-raised px-4"
        >
          <Ionicons name="add" size={18} color={WorkoutTheme.text.primary} />
          <Text className="text-sm font-semibold text-ink">{t.addRestDay}</Text>
        </PressableScale>
      </View>

      <View className="mb-4 rounded-card bg-background p-3">
        {days.length === 0 ? (
          <View className="items-center py-6">
            <Ionicons
              name="calendar-outline"
              size={36}
              color={WorkoutTheme.text.secondary}
            />
            <Text className="mt-2 text-sm text-ink-soft">
              {t.noDaysYet}
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={days}
            keyExtractor={(item) => String(item.dayNumber)}
            onDragEnd={({ data }) =>
              onChangeDays(
                data.map((item, index) => ({ ...item, dayNumber: index + 1 })),
              )
            }
            renderItem={renderDayItem}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </View>

      <Modal
        visible={showWorkoutPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorkoutPicker(false)}
      >
        <View className="flex-1 justify-end bg-scrim">
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
                <View className="items-center py-6">
                  <Text className="text-sm text-ink-soft">
                    {t.noWorkoutAvailable}
                  </Text>
                  <Text className="mt-1 text-xs text-ink-soft">
                    {t.createWorkoutFirst}
                  </Text>
                </View>
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
        </View>
      </Modal>
    </View>
  );
}
