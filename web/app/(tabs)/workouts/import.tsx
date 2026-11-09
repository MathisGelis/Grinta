import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/ui/Screen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { TextField } from "@/components/ui/FormField";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { createProgramme } from "@/services/programms.service";
import {
  createPlannedWorkout,
  importWorkoutsFromText,
  type ImportDraft,
} from "@/services/workouts.service";
import { TokenService } from "@/services/token.service";

const MAX_LENGTH = 10000;
const DEFAULT_REST_SECONDS = 90;

/** Import d'un programme depuis des notes (9.4) : le serveur ne renvoie qu'un brouillon. */
export default function ImportWorkoutsScreen() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  // Index des séances du brouillon que l'utilisateur ne veut pas enregistrer.
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [hiddenLines, setHiddenLines] = useState<Set<number>>(new Set());

  const analyse = async () => {
    if (!text.trim()) return;
    setAnalysing(true);
    try {
      setDraft(await importWorkoutsFromText(text));
      setRemoved(new Set());
      setHiddenLines(new Set());
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.genericError);
    } finally {
      setAnalysing(false);
    }
  };

  const keptWorkouts = draft ? draft.workouts.map((w, i) => ({ w, i })).filter(({ i }) => !removed.has(i)) : [];

  const save = async () => {
    if (!draft || keptWorkouts.length === 0) return;
    setSaving(true);
    try {
      const token = (await TokenService.get()) ?? undefined;
      const ids = new Map<number, string>();
      for (const { w, i } of keptWorkouts) {
        // Seuls exerciseId, sets et plannedRestSeconds sont acceptés par exercice.
        const created = await createPlannedWorkout(
          {
            title: w.title,
            description: "",
            exercises: w.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              sets: e.sets,
              plannedRestSeconds: e.plannedRestSeconds ?? DEFAULT_REST_SECONDS,
            })),
          },
          token,
        );
        ids.set(i, created.id);
      }
      if (draft.programme) {
        await createProgramme({
          weekNumber: 1,
          difficulty: "BEGINNER",
          locationType: "ANY",
          title: draft.programme.title,
          days: draft.programme.days.map((d) => ({
            dayNumber: d.dayNumber,
            workoutId: d.workoutIndex != null ? (ids.get(d.workoutIndex) ?? null) : null,
          })),
        });
      }
      Alert.alert(t.imSaved, t.imSavedMessage, [{ text: t.ok, onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.genericError);
    } finally {
      setSaving(false);
    }
  };

  const reason = (r: string) => (r === "no_exercise" ? t.imReasonNoExercise : t.imReasonUnknown);
  const unrecognized = (draft?.unrecognized ?? []).filter((u) => !hiddenLines.has(u.line));

  return (
    <View className="flex-1">
      <ScreenHeader title={t.imTitle} />
      <Screen topInset={false} tabBar={false} keyboardShouldPersistTaps="handled">
        <Text className="text-sm text-ink-muted">{t.imIntro}</Text>
        <TextField
          multiline
          placeholder={t.imPlaceholder}
          value={text}
          onChangeText={setText}
          maxLength={MAX_LENGTH}
          autoCapitalize="sentences"
          style={{ minHeight: 160, textAlignVertical: "top" }}
        />
        <Button label={t.imAnalyse} icon="sparkles-outline" loading={analysing} onPress={analyse} disabled={!text.trim()} />

        {draft ? (
          <View className="gap-4">
            <SectionHeader title={t.imDraft} />
            {draft.workouts.length === 0 ? (
              <Text className="text-sm text-ink-muted">{t.imNothing}</Text>
            ) : (
              draft.workouts.map((w, i) => (
                <Card key={i} tone={removed.has(i) ? "raised" : "surface"} className={`gap-2 ${removed.has(i) ? "opacity-50" : ""}`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-base font-semibold text-ink">{w.title}</Text>
                    <IconButton
                      icon={removed.has(i) ? "add" : "close"}
                      label={t.imRemoveLine}
                      onPress={() =>
                        setRemoved((prev) => {
                          const next = new Set(prev);
                          if (!next.delete(i)) next.add(i);
                          return next;
                        })
                      }
                    />
                  </View>
                  {w.exercises.map((e) => (
                    <View key={`${e.line}-${e.exerciseId}`} className="flex-row justify-between">
                      <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                        {e.name}
                      </Text>
                      <Text className="text-sm text-ink-muted">
                        {e.durationSeconds != null
                          ? `${e.durationSeconds}s`
                          : format(t.imWorkoutLine, { sets: e.sets.length })}
                      </Text>
                    </View>
                  ))}
                </Card>
              ))
            )}

            {draft.programme ? (
              <Card tone="raised" className="gap-1">
                <Text className="text-base font-semibold text-ink">
                  {t.imProgrammeTitle} · {draft.programme.title}
                </Text>
                {draft.programme.days.map((d) => (
                  <Text key={d.dayNumber} className="text-sm text-ink-muted">
                    {d.label}
                    {d.workoutIndex == null || removed.has(d.workoutIndex) ? ` (${t.imDayRest})` : ""}
                  </Text>
                ))}
              </Card>
            ) : null}

            {unrecognized.length > 0 ? (
              <View className="gap-2">
                <SectionHeader title={t.imUnrecognized} />
                {unrecognized.map((u) => (
                  <View key={u.line} className="flex-row items-center gap-2 rounded-tile bg-surface p-3">
                    <View className="flex-1">
                      <Text className="text-sm text-ink" numberOfLines={2}>
                        {format(t.imUnrecognizedLine, { n: u.line, text: u.text })}
                      </Text>
                      <Text className="text-xs text-ink-muted">{reason(u.reason)}</Text>
                    </View>
                    <IconButton
                      icon="close"
                      label={t.imRemoveLine}
                      onPress={() => setHiddenLines((prev) => new Set(prev).add(u.line))}
                    />
                  </View>
                ))}
              </View>
            ) : null}

            <Button
              label={t.imSave}
              loading={saving}
              disabled={keptWorkouts.length === 0}
              onPress={save}
            />
          </View>
        ) : null}
      </Screen>
    </View>
  );
}
