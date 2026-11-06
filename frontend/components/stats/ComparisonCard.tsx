import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { StatsService, type Comparisons, type StatsPeriod } from "@/services/stats.service";
import SectionHeader from "@/components/ui/SectionHeader";
import { localDate } from "@/utils/date";

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Période en cours comparée à la moyenne personnelle (3.4), codes `insights` traduits (B-10). */
export default function ComparisonCard({ period }: { period: StatsPeriod }) {
  const { t } = useTranslation();
  const [data, setData] = useState<Comparisons | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    StatsService.getComparisons(period, localDate())
      .then((d) => !cancelled && setData(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (!data) return null;

  const rows = [
    { key: "workouts", label: t.stComparisonWorkouts },
    { key: "volume", label: t.stComparisonVolume },
  ].map((r) => {
    const c = (data.comparison?.[r.key] ?? {}) as Record<string, unknown>;
    return {
      ...r,
      current: num(c.current),
      usual: num(c.expectedByNow) ?? num(c.baseline) ?? num(c.average),
      pct: num(c.changePct),
    };
  });
  const insights = Array.isArray(data.insights) ? data.insights : [];
  if (data.baseline == null && insights.length === 0) return null;
  const elapsed = num(data.elapsedPct);

  return (
    <View className="gap-3">
      <SectionHeader title={t.stComparisonTitle} />
      <View className="gap-4 rounded-card bg-surface p-5">
        {data.baseline != null
          ? rows.map((r) => (
              <View key={r.key} className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm text-ink">{r.label}</Text>
                  {r.usual != null ? (
                    <Text className="text-xs text-ink-muted">
                      {format(t.stComparisonUsual, { n: Math.round(r.usual * 10) / 10 })}
                    </Text>
                  ) : null}
                </View>
                <View className="items-end">
                  {r.current != null ? (
                    <Text className="text-lg font-semibold text-ink">{r.current}</Text>
                  ) : null}
                  {r.pct != null ? (
                    <Text
                      className="text-xs font-medium"
                      style={{
                        color: r.pct >= 0 ? WorkoutTheme.status.success : WorkoutTheme.status.danger,
                      }}
                    >
                      {r.pct > 0 ? "+" : ""}
                      {Math.round(r.pct)}%
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          : null}
        {elapsed != null && data.baseline != null ? (
          <Text className="text-xs text-ink-muted">
            {format(t.stComparisonElapsed, { pct: Math.round(elapsed) })}
          </Text>
        ) : null}
        {insights.map((code) => (
          <Text key={code} className="text-xs text-ink-muted">
            {t.insights[code] ?? code}
          </Text>
        ))}
      </View>
    </View>
  );
}
