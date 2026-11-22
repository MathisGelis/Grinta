import React, { useEffect, useMemo, useState } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { StatsService, type Heatmap } from "@/services/stats.service";
import SectionHeader from "@/components/ui/SectionHeader";
import IconButton from "@/components/ui/IconButton";

const GAP = 2;
const ALPHAS = [0.1, 0.35, 0.55, 0.8, 1];

const key = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

/** Calendrier annuel (3.4) : niveau d'intensité de 1 à 4 par jour actif. Jours en UTC. */
export default function HeatmapCard() {
  const { t } = useTranslation();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState<Heatmap | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    StatsService.getHeatmap(year)
      .then((d) => !cancelled && setData(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [year]);

  const levels = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of data?.days ?? []) map.set(String(day.date).slice(0, 10), day.level);
    return map;
  }, [data]);

  // Colonnes = semaines (lundi en premier), lignes = jours.
  const weeks = useMemo(() => {
    const start = new Date(Date.UTC(year, 0, 1));
    const offset = (start.getUTCDay() + 6) % 7;
    const cells: (string | null)[] = Array(offset).fill(null);
    const end = Date.UTC(year, 11, 31);
    for (let ms = start.getTime(); ms <= end; ms += 86400000) cells.push(key(new Date(ms)));
    while (cells.length % 7) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [year]);

  const size = width > 0 ? Math.max(3, (width - GAP * (weeks.length - 1)) / weeks.length) : 0;

  return (
    <View className="gap-3">
      <SectionHeader title={t.stHeatmapTitle} />
      <View className="gap-3 rounded-card bg-surface p-5">
        <View className="flex-row items-center justify-between">
          <IconButton icon="chevron-back" label={String(year - 1)} onPress={() => setYear((y) => y - 1)} />
          <Text className="text-base font-semibold text-ink">{year}</Text>
          <IconButton
            icon="chevron-forward"
            label={String(year + 1)}
            onPress={() => setYear((y) => Math.min(thisYear, y + 1))}
          />
        </View>
        <View
          className="flex-row"
          style={{ gap: GAP }}
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        >
          {size > 0
            ? weeks.map((week, w) => (
                <View key={w} style={{ gap: GAP }}>
                  {week.map((day, d) => {
                    const level = day ? (levels.get(day) ?? 0) : -1;
                    return (
                      <View
                        key={d}
                        style={{
                          width: size,
                          height: size,
                          borderRadius: 2,
                          backgroundColor:
                            level < 0
                              ? "transparent"
                              : withAlpha(WorkoutTheme.accent.purple, ALPHAS[Math.min(level, 4)]),
                        }}
                      />
                    );
                  })}
                </View>
              ))
            : null}
        </View>
        <View className="flex-row items-center justify-end gap-1.5">
          <Text className="mr-1 text-xs text-ink-muted">{t.stHeatmapLegend}</Text>
          {ALPHAS.map((a) => (
            <View
              key={a}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: withAlpha(WorkoutTheme.accent.purple, a),
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
