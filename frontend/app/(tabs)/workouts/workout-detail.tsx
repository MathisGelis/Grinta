import React, { useCallback, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import IconButton from "@/components/ui/IconButton";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader, { useFloatingHeaderHeight } from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import WorkoutCardBody, {
  type WorkoutCardBodyHandle,
  type WorkoutEditState,
} from "@/components/workout/card/WorkoutCardBody";
import WorkoutActionMenu from "@/components/workout/card/WorkoutActionMenu";
import { useTranslation } from "@/contexts/LanguageContext";
import type { fullPlannedWorkout } from "@/services/workouts.service";

/** Page d'une séance planifiée : infos, exercices, statistiques, modification et suppression. */
export default function PlannedWorkoutDetailScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = useFloatingHeaderHeight();
  const params = useLocalSearchParams<{ workoutId?: string; title?: string }>();
  const workoutId = Array.isArray(params.workoutId) ? params.workoutId[0] : params.workoutId;
  const paramTitle = (Array.isArray(params.title) ? params.title[0] : params.title) ?? "";
  const [loaded, setLoaded] = useState<fullPlannedWorkout | null>(null);
  const [editedTitle, setEditedTitle] = useState(paramTitle);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editState, setEditState] = useState<WorkoutEditState>({
    isEditing: false,
    hasChanges: false,
    isSaving: false,
  });
  const bodyRef = useRef<WorkoutCardBodyHandle>(null);

  const handleDelete = useCallback(() => router.back(), []);
  const { isEditing, isSaving } = editState;

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader
        floating
        title={editedTitle || loaded?.title || paramTitle}
        backIcon={isEditing ? "close" : "chevron-back"}
        onBack={isEditing ? () => (isSaving ? undefined : bodyRef.current?.cancel()) : undefined}
        right={
          isEditing ? (
            <IconButton
              icon="checkmark"
              label={t.save}
              variant="accent"
              className={isSaving ? "opacity-50" : ""}
              onPress={isSaving ? undefined : () => bodyRef.current?.save()}
            />
          ) : (
            <IconButton
              icon="ellipsis-horizontal"
              label={t.editLabel}
              variant="glass"
              onPress={() => setMenuOpen((open) => !open)}
            />
          )
        }
      />
      {workoutId ? (
        <ScrollView
          {...chromeScrollProps}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: headerHeight,
            paddingBottom: TAB_BAR_SPACE + insets.bottom,
          }}
        >
          <View>
            <WorkoutCardBody
              ref={bodyRef}
              workout={{
                id: workoutId,
                title: loaded?.title ?? paramTitle,
                description: loaded?.description,
              }}
              editedTitle={editedTitle}
              onEditedTitleChange={setEditedTitle}
              onLoaded={setLoaded}
              onDelete={handleDelete}
              onEditState={setEditState}
            />
          </View>
        </ScrollView>
      ) : null}

      {menuOpen && !isEditing ? (
        <WorkoutActionMenu
          onClose={() => setMenuOpen(false)}
          items={[
            { icon: "create-outline", label: t.editLabel, onPress: () => bodyRef.current?.edit() },
            { icon: "trash-outline", label: t.delete, danger: true, onPress: () => bodyRef.current?.remove() },
          ]}
        />
      ) : null}
    </View>
  );
}
