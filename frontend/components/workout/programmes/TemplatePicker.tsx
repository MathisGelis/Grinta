import React, { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { startProgramme } from "@/services/programms.service";
import {
  getWorkoutTemplates,
  applyWorkoutTemplate,
  previewWorkoutTemplate,
  type TemplatePreview,
  type WorkoutTemplate,
} from "@/services/workouts.service";
import { localDate } from "@/utils/date";
import { normalizeText } from "@/utils/text";
import { TemplateListSkeleton } from "@/components/ui/skeletons";
import EmptyState from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";
import TemplatePreviewSheet from "./TemplatePreviewSheet";

type Props = {
  /** Filtre local sur le titre et la description. */
  query?: string;
  /** Appelé une fois un modèle copié et son programme démarré. */
  onUsed: () => void;
};

/** Liste des modèles de séances, classés par le serveur selon le profil (9.3). */
export default function TemplatePicker({ onUsed, query = "" }: Props) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<WorkoutTemplate[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<WorkoutTemplate | null>(null);
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const openPreview = useCallback((template: WorkoutTemplate) => {
    setSelected(template);
    setPreview(null);
    setPreviewFailed(false);
    previewWorkoutTemplate(template.key)
      .then(setPreview)
      .catch(() => setPreviewFailed(true));
  }, []);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setTemplates((await getWorkoutTemplates()).templates);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const use = async (template: WorkoutTemplate) => {
    if (busyKey) return;
    setBusyKey(template.key);
    try {
      // Accepté tel quel : le serveur enregistre séances et programme.
      const programme = await applyWorkoutTemplate(template.key);
      // Le modèle crée un programme non démarré : on le lance avec la date locale.
      await startProgramme(programme.id, localDate());
      setSelected(null);
      toast.success(t.tplUsedMessage);
      onUsed?.();
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusyKey(null);
    }
  };

  if (failed) return <ErrorState onRetry={load} />;
  if (!templates) return <TemplateListSkeleton count={3} />;
  const needle = normalizeText(query.trim());
  const visible = needle
    ? templates.filter((tpl) => normalizeText(`${tpl.title} ${tpl.description}`).includes(needle))
    : templates;
  if (visible.length === 0) {
    return (
      <EmptyState
        plain
        icon="albums-outline"
        title={templates.length === 0 ? t.tplEmpty : t.noResultsLabel}
      />
    );
  }

  return (
    <View className="gap-3">
      {visible.map((tpl) => (
        <Card key={tpl.key} tone={tpl.recommended ? "accentTint" : "surface"} className="gap-3">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-lg font-semibold text-ink">{tpl.title}</Text>
            {tpl.recommended ? (
              <View className="rounded-full bg-accent px-3 py-1">
                <Text className="text-xs font-semibold text-on-accent">{t.tplRecommended}</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-sm text-ink-soft">{tpl.description}</Text>
          <Text className="text-xs text-ink-muted">
            {format(t.tplDaysPerWeek, { n: tpl.daysPerWeek })} ·{" "}
            {format(t.tplWorkoutsCount, { n: tpl.workouts.length })}
          </Text>
          <Button
            label={t.tplUse}
            variant={tpl.recommended ? "primary" : "secondary"}
            onPress={() => openPreview(tpl)}
          />
        </Card>
      ))}
      <TemplatePreviewSheet
        visible={!!selected}
        title={selected?.title ?? ""}
        preview={preview}
        failed={previewFailed}
        saving={!!busyKey}
        onRetry={() => selected && openPreview(selected)}
        onClose={() => !busyKey && setSelected(null)}
        onSave={() => selected && use(selected)}
      />
    </View>
  );
}
