import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { useUnits } from "@/contexts/UnitsContext";
import { getAllExerciseStats, type ExerciseStats } from "@/services/exercises.service";
import {
  StatsService,
  type Progression,
  type ProgressionMetric,
  type ProgressionPeriod,
} from "@/services/stats.service";
import SectionHeader from "@/components/ui/SectionHeader";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Chip from "@/components/ui/Chip";

const PERIODS: ProgressionPeriod[] = ["1m", "3m", "6m", "1y", "all"];
const MAX_EXERCISES = 12;
const CHART_HEIGHT = 120;

/** Courbe d'un exercice (3.4) : un point par jour d'entraînement. */
export default function ProgressionCard() {
  const { t } = useTranslation();
  const { formatVolume, formatWeight } = useUnits();
  const [exercises, setExercises] = useState<ExerciseStats[] | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [metric, setMetric] = useState<ProgressionMetric>("volume");
  const [period, setPeriod] = useState<ProgressionPeriod>("3m");
  const [data, setData] = useState<Progression | null>(null);

  useEffect(() => {
    getAllExerciseStats()
      .then((list) => {
        const top = list.slice(0, MAX_EXERCISES);
        setExercises(top);
        setExerciseId((current) => current ?? top[0]?.exerciseId ?? null);
      })
      .catch(() => setExercises([]));
  }, []);

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
    <View className="gap-3">
      <SectionHeader title={t.stProgressionTitle} />
      <View className="gap-4 rounded-card bg-surface p-5">
        {exercises.length === 0 ? (
          <Text className="text-sm text-ink-muted">{t.stNoPracticed}</Text>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {exercises.map((e) => (
                <Chip
                  key={e.exerciseId}
                  label={e.exerciseName}
                  active={e.exerciseId === exerciseId}
                  onPress={() => setExerciseId(e.exerciseId)}
                />
              ))}
            </ScrollView>
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
              <Text className="text-sm text-ink-muted">{t.stNoProgression}</Text>
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
