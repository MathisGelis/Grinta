import React from "react";
import { ScrollView, Text, View } from "react-native";
import Modal from "@/components/ui/AppModal";
import Button from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/skeletons";
import ErrorState from "@/components/ui/ErrorState";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import type { TemplatePreview } from "@/services/workouts.service";

type Props = {
  visible: boolean;
  title: string;
  preview: TemplatePreview | null;
  failed?: boolean;
  saving?: boolean;
  onRetry: () => void;
  onClose: () => void;
  /** L'utilisateur accepte la proposition : c'est seulement là qu'on l'enregistre. */
  onSave: () => void;
};

/** Proposition d'un modèle (rien n'est enregistré tant que l'utilisateur ne valide pas). */
export default function TemplatePreviewSheet({
  visible,
  title,
  preview,
  failed,
  saving,
  onRetry,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={{ justifyContent: "flex-end", margin: 0 }}
    >
      <View className="max-h-[85%] gap-4 rounded-t-hero bg-surface px-5 pb-8 pt-3">
        <View className="h-1.5 w-12 self-center rounded-full bg-raised" />
        <Text className="text-xl font-semibold text-ink">{title}</Text>

        {failed ? (
          <ErrorState onRetry={onRetry} />
        ) : !preview ? (
          <ListSkeleton count={3} gap={12} />
        ) : (
          <>
            {preview.programme.description ? (
              <Text className="text-sm text-ink-soft">{preview.programme.description}</Text>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4">
              <View className="gap-2">
                <Text className="text-xs font-semibold uppercase text-ink-muted">{t.tplPreviewWorkouts}</Text>
                {preview.programme.days.map((day) => {
                  const workout = day.workoutIndex != null ? preview.workouts[day.workoutIndex] : null;
                  return (
                    <View key={day.dayNumber} className="gap-2 rounded-tile bg-raised p-4">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="text-sm font-semibold text-ink">
                          {format(t.dayN, { n: day.dayNumber })}
                        </Text>
                        <Text className="flex-1 text-right text-sm text-ink-soft" numberOfLines={1}>
                          {workout ? workout.title : t.restDay}
                        </Text>
                      </View>
                      {workout
                        ? workout.exercises.map((exercise, index) => (
                            <View key={`${exercise.exerciseId}-${index}`} className="flex-row justify-between gap-3">
                              <Text className="flex-1 text-xs text-ink-muted" numberOfLines={1}>
                                {exercise.name}
                              </Text>
                              <Text className="text-xs text-ink-muted" style={{ fontVariant: ["tabular-nums"] }}>
                                {exercise.durationSeconds
                                  ? `${exercise.durationSeconds}s`
                                  : format(t.setsCount, { n: exercise.sets.length })}
                              </Text>
                            </View>
                          ))
                        : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
            <View className="flex-row gap-3">
              <Button className="flex-1" variant="secondary" label={t.cancel} onPress={onClose} />
              <Button className="flex-1" label={t.tplSaveProgramme} loading={saving} onPress={onSave} />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
