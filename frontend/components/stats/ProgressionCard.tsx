import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { useUnits } from "@/contexts/UnitsContext";
import { getExerciseStatsPage, type ExerciseStats } from "@/services/exercises.service";
import {
  StatsService,
  type Progression,
  type ProgressionMetric,
  type ProgressionPeriod,
} from "@/services/stats.service";
import SectionHeader from "@/components/ui/SectionHeader";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Chip from "@/components/ui/Chip";
import PressableScale from "@/components/ui/PressableScale";

const PERIODS: ProgressionPeriod[] = ["1m", "3m", "6m", "1y", "all"];
const MAX_EXERCISES = 12;
const CHART_HEIGHT = 120;

/** Courbe d'un exercice (3.4) : un point par jour d'entraînement. */
/** `exerciseId` fixé : courbe d'un seul exercice (détail d'exercice), sans sélecteur. */
export default function ProgressionCard({ exerciseId: fixedId }: { exerciseId?: string }) {
  const { t } = useTranslation();
  const { formatVolume, formatWeight } = useUnits();
  const [exercises, setExercises] = useState<ExerciseStats[] | null>(fixedId ? [] : null);
  const [exerciseId, setExerciseId] = useState<string | null>(fixedId ?? null);
  const [metric, setMetric] = useState<ProgressionMetric>("volume");
  const [period, setPeriod] = useState<ProgressionPeriod>("3m");
  const [data, setData] = useState<Progression | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (fixedId) return;
    getExerciseStatsPage(MAX_EXERCISES)
      .then(({ items }) => {
        const top = items.slice(0, MAX_EXERCISES);
        setExercises(top);
        setExerciseId((current) => current ?? top[0]?.exerciseId ?? null);
      })
      .catch(() => setExercises([]));
  }, [fixedId]);

  useEffect(() => {
    if (!exerciseId) return;
    let cancelled = false;
    setData(null);
    StatsService.getProgression(exerciseId, metric, period)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData({ exerciseId, metric, period, points: [] }));
    return () => {
      cancelled = true;
    };
  }, [exerciseId, metric, period]);

  if (exercises === null) return null;

  const periodLabel: Record<ProgressionPeriod, string> = {
    "1m": t.stPeriod1m,
    "3m": t.stPeriod3m,
    "6m": t.stPeriod6m,
    "1y": t.stPeriod1y,
    all: t.stPeriodAll,
  };
  const points = (data?.points ?? []).filter((p) => typeof p.value === "number");
  const max = Math.max(1, ...points.map((p) => p.value));
  const last = points[points.length - 1];
  const fmt = (v: number) => (metric === "volume" ? formatVolume(v) : formatWeight(v));

  return (
    <View className="gap-3" style={{ zIndex: 10 }}>
      <SectionHeader title={t.stProgressionTitle} />
      <View className="gap-4 rounded-card bg-surface p-5">
        {!fixedId && exercises.length === 0 ? (
          <Text className="text-sm text-ink-muted">{t.stNoPracticed}</Text>
        ) : (
          <>
            {fixedId ? null : (
              <View className="gap-2" style={{ zIndex: 10 }}>
                <Text className="text-base font-medium text-ink">{t.stProgressionExercise}</Text>
                <View>
                  <PressableScale
                    onPress={() => setPickerOpen((o) => !o)}
                    halo={false}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: pickerOpen }}
                  >
                    <View
                      className="flex-row items-center justify-between gap-2 rounded-tile bg-raised px-4"
                      style={{ height: 48 }}
                    >
                      <Text className="flex-1 text-base text-ink" numberOfLines={1}>
                        {exercises.find((e) => e.exerciseId === exerciseId)?.exerciseName ?? ""}
                      </Text>
                      <Ionicons
                        name={pickerOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={WorkoutTheme.text.secondary}
                      />
                    </View>
                  </PressableScale>
                  {pickerOpen ? (
                    <View
                      className="overflow-hidden rounded-tile bg-raised"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 8,
                        maxHeight: 240,
                        zIndex: 20,
                        elevation: 20,
                      }}
                    >
                      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                        {exercises.map((e, index) => {
                          const isSelected = e.exerciseId === exerciseId;
                          return (
                            <Pressable
                              key={e.exerciseId}
                              onPress={() => {
                                setExerciseId(e.exerciseId);
                                setPickerOpen(false);
                              }}
                              className="flex-row items-center justify-between px-4 py-3"
                              style={{
                                backgroundColor: isSelected
                                  ? withAlpha(WorkoutTheme.accent.purple, 0.22)
                                  : undefined,
                                borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                                borderTopColor: WorkoutTheme.overlay.glassBorder,
                              }}
                              accessibilityRole="button"
                              accessibilityState={{ selected: isSelected }}
                            >
                              <Text
                                className={`flex-1 text-base text-ink ${isSelected ? "font-semibold" : ""}`}
                                numberOfLines={1}
                              >
                                {e.exerciseName}
                              </Text>
                              {isSelected ? (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={20}
                                  color={WorkoutTheme.accent.purple}
                                />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
                <Text className="text-xs text-ink-muted">{t.stProgressionHint}</Text>
              </View>
            )}
            <SegmentedControl<ProgressionMetric>
              id="progression-metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "volume", label: t.stMetricVolume },
                { value: "1rm", label: t.stMetricRm },
              ]}
            />
            <View className="flex-row justify-between">
              {PERIODS.map((p) => (
                <Chip key={p} label={periodLabel[p]} active={p === period} onPress={() => setPeriod(p)} className="px-3" />
              ))}
            </View>
            {data && points.length < 2 ? (
              <View className="items-center gap-2 py-4">
                <Ionicons name="stats-chart-outline" size={28} color={WorkoutTheme.text.tertiary} />
                <Text className="text-center text-sm text-ink-muted">{t.stNoProgression}</Text>
              </View>
            ) : points.length >= 2 ? (
              <View className="gap-2">
                {last ? <Text className="text-lg font-semibold text-ink">{fmt(last.value)}</Text> : null}
                <View className="flex-row items-end gap-[2px]" style={{ height: CHART_HEIGHT }}>
                  {points.map((p) => (
                    <View
                      key={p.date}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: Math.max(3, (p.value / max) * CHART_HEIGHT),
                        backgroundColor: WorkoutTheme.accent.purple,
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}
