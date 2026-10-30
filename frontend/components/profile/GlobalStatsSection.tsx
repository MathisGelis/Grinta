import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import {
  StatsService,
  StatsPeriod,
  PeriodSummary,
  Consistency,
  MuscleDistribution,
  TrainingBalance,
  MuscleFrequency,
  MuscleRecoveryStatus,
} from "@/services/stats.service";
import MuscleMap from "@/components/ui/MuscleMap";
import type { MuscleValue } from "@/utils/muscles";
import SectionHeader from "@/components/ui/SectionHeader";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Stat from "@/components/ui/Stat";

const TOP_MUSCLES = 6;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}min`;
}

function formatVolume(volume: number): string {
  return volume >= 1000 ? `${(volume / 1000).toFixed(1)}T` : `${Math.round(volume)}kg`;
}

function Bar({ percent, color }: { percent: number; color: string }) {
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-raised">
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: color }}
      />
    </View>
  );
}

function Delta({ pct }: { pct: number | null | undefined }) {
  if (pct == null || pct === 0) return null;
  const up = pct > 0;
  return (
    <Text
      className="text-xs font-medium"
      style={{ color: up ? WorkoutTheme.status.success : WorkoutTheme.status.danger }}
    >
      {up ? "+" : ""}
      {Math.round(pct)}%
    </Text>
  );
}

export default function GlobalStatsSection() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<StatsPeriod>("week");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [distribution, setDistribution] = useState<MuscleDistribution | null>(null);
  const muscleData = useMemo<MuscleValue[]>(
    () =>
      (distribution?.distribution ?? []).map((m) => ({
        muscle: m.muscle,
        value: m.effectiveSets,
      })),
    [distribution],
  );
  const [balance, setBalance] = useState<TrainingBalance | null>(null);
  const [consistency, setConsistency] = useState<Consistency | null>(null);
  const [frequency, setFrequency] = useState<MuscleFrequency | null>(null);

  useEffect(() => {
    StatsService.getConsistency().then(setConsistency).catch(() => {});
    StatsService.getMuscleFrequency().then(setFrequency).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      StatsService.getSummary(period).catch(() => null),
      StatsService.getMuscleDistribution(period).catch(() => null),
      StatsService.getBalance(period).catch(() => null),
    ]).then(([sum, dist, bal]) => {
      if (cancelled) return;
      setSummary(sum);
      setDistribution(dist);
      setBalance(bal);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const statusColor: Record<MuscleRecoveryStatus, string> = {
    recovering: WorkoutTheme.status.danger,
    ready: WorkoutTheme.status.success,
    overdue: WorkoutTheme.status.warning,
    never: WorkoutTheme.text.tertiary,
  };
  const statusLabel: Record<MuscleRecoveryStatus, string> = {
    recovering: t.recoveryRecovering,
    ready: t.recoveryReady,
    overdue: t.recoveryOverdue,
    never: "–",
  };

  const muscleName = (key: string) => t.muscleNames[key] ?? key;

  const totals = summary
    ? [
        { key: "workouts", label: t.workoutsLabel, value: String(summary.current.workouts) },
        { key: "durationSeconds", label: t.duration, value: formatDuration(summary.current.durationSeconds) },
        { key: "sets", label: t.sets, value: String(summary.current.sets) },
        { key: "reps", label: t.repsLabel, value: String(summary.current.reps) },
        { key: "volume", label: t.volumeLabel, value: formatVolume(summary.current.volume) },
        { key: "calories", label: t.calories, value: String(Math.round(summary.current.calories)) },
      ]
    : [];

  const RECOVERY_PRIORITY: Record<MuscleRecoveryStatus, number> = {
    recovering: 3,
    overdue: 2,
    ready: 1,
    never: 0,
  };
  const recoveryData: MuscleValue[] = (frequency?.muscles ?? [])
    .filter((m) => m.status !== "never")
    .map((m) => ({
      muscle: m.muscle,
      value: RECOVERY_PRIORITY[m.status],
      color: statusColor[m.status],
      label:
        m.daysSinceLastTrained != null
          ? `${statusLabel[m.status]} · ${format(t.daysAgoShort, { n: m.daysSinceLastTrained })}`
          : statusLabel[m.status],
    }));
  const recoveryLegend = (["recovering", "ready", "overdue"] as const).map((status) => ({
    color: statusColor[status],
    label: statusLabel[status],
  }));

  const weekly = consistency?.weeklyActivity.slice(-12) ?? [];
  const weeklyMax = Math.max(1, ...weekly.map((w) => w.workoutCount));

  const empty = !loading && !summary && !consistency && !frequency;

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-semibold text-ink">{t.periodSummaryTitle}</Text>
        <SegmentedControl<StatsPeriod>
          id="profile-stats-period"
          className="w-[96px]"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "week", label: t.viewWeek, icon: "reorder-two-outline" },
            { value: "month", label: t.viewMonth, icon: "grid-outline" },
          ]}
        />
      </View>

      {empty ? (
        <View className="items-center rounded-card bg-surface p-8">
          <Text className="text-base text-ink-muted">{t.noStatsYet}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="small" color={WorkoutTheme.accent.purple} />
      ) : (
        <>
          {summary ? (
            <View className="gap-3">
              <View className="flex-row flex-wrap gap-3">
                {totals.map((item) => (
                  <View
                    key={item.key}
                    className="rounded-tile bg-surface p-4"
                    style={{ width: "47.5%", flexGrow: 1 }}
                  >
                    <Stat value={item.value} label={item.label} size="md" />
                    <Delta pct={summary.delta[item.key]?.changePct} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {distribution && distribution.distribution.length > 0 ? (
            <View className="gap-3">
              <SectionHeader title={t.muscleDistributionTitle} />
              <View className="gap-6 rounded-card bg-surface p-5">
                <MuscleMap data={muscleData} unit={t.sets.toLowerCase()} />
                {distribution.distribution.slice(0, TOP_MUSCLES).map((m) => (
                  <View key={m.muscle} className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-ink">{muscleName(m.muscle)}</Text>
                      <Text className="text-sm text-ink-muted">{Math.round(m.percentage)}%</Text>
                    </View>
                    <Bar percent={m.percentage} color={WorkoutTheme.accent.purple} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {balance && balance.totalEffectiveSets > 0 ? (
            <View className="gap-3">
              <SectionHeader title={t.trainingBalanceTitle} />
              <View className="gap-4 rounded-card bg-surface p-5">
                <View className="flex-row gap-3">
                  <View className="flex-1 items-center rounded-tile bg-raised p-4">
                    <Stat
                      value={balance.pushPullRatio ?? "–"}
                      label={t.pushPullLabel}
                      className="items-center"
                      size="md"
                    />
                  </View>
                  <View className="flex-1 items-center rounded-tile bg-raised p-4">
                    <Stat
                      value={balance.upperLowerRatio ?? "–"}
                      label={t.upperLowerLabel}
                      className="items-center"
                      size="md"
                    />
                  </View>
                </View>
                {balance.byCategory.map((g) => (
                  <View key={g.name} className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm capitalize text-ink">{g.name}</Text>
                      <Text className="text-sm text-ink-muted">{Math.round(g.percentage)}%</Text>
                    </View>
                    <Bar percent={g.percentage} color={WorkoutTheme.accent.purple} />
                  </View>
                ))}
                {balance.insights.map((line) => (
                  <Text key={line} className="text-xs text-ink-muted">
                    {line}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}

      {consistency ? (
        <View className="gap-3">
          <SectionHeader title={t.consistencyTitle} />
          <View className="gap-5 rounded-card bg-surface p-5">
            <View className="flex-row flex-wrap gap-y-4">
              {[
                { label: t.streak, value: consistency.currentStreakDays },
                { label: t.longestStreakLabel, value: consistency.longestStreakDays },
                { label: t.avgPerWeekLabel, value: consistency.averageWorkoutsPerWeek },
                { label: t.trainingDaysLabel, value: consistency.totalTrainingDays },
              ].map((item) => (
                <View key={item.label} style={{ width: "50%" }}>
                  <Stat value={item.value} label={item.label} size="md" />
                </View>
              ))}
            </View>
            {weekly.length > 0 ? (
              <View className="h-16 flex-row items-end gap-1.5">
                {weekly.map((w) => (
                  <View
                    key={w.weekStart}
                    className="flex-1 rounded-full"
                    style={{
                      height: `${Math.max(8, (w.workoutCount / weeklyMax) * 100)}%`,
                      backgroundColor:
                        w.workoutCount > 0
                          ? WorkoutTheme.accent.purple
                          : withAlpha(WorkoutTheme.accent.purple, 0.2),
                    }}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {recoveryData.length > 0 ? (
        <View className="gap-3">
          <SectionHeader title={t.muscleRecoveryTitle} />
          <View className="rounded-card bg-surface p-5">
            <MuscleMap data={recoveryData} legend={recoveryLegend} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
