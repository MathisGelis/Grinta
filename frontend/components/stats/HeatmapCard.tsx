import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { StatsService, type Heatmap, type HeatmapDay } from "@/services/stats.service";
import SectionHeader from "@/components/ui/SectionHeader";
import IconButton from "@/components/ui/IconButton";

const GAP = 3;
const MONTH_GAP = 10;
const CELL = 11;
const ALPHAS = [0.1, 0.35, 0.55, 0.8, 1];

const key = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

/** Calendrier annuel (3.4) : niveau d'intensité de 1 à 4 par jour actif. Jours en UTC. */
export default function HeatmapCard() {
  const { t, lang } = useTranslation();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [data, setData] = useState<Heatmap | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setSelected(null);
    StatsService.getHeatmap(year)
      .then((d) => !cancelled && setData(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [year]);

  const levels = useMemo(() => {
    const map = new Map<string, HeatmapDay>();
    for (const day of data?.days ?? []) map.set(String(day.date).slice(0, 10), day);
    return map;
  }, [data]);

  // Un bloc par mois : lignes de 7 jours (lundi en premier), chaque jour dans son mois.
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, m) => {
        const name = new Date(Date.UTC(year, m, 1)).toLocaleDateString(lang, {
          month: "long",
          timeZone: "UTC",
        });
        const count = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
        const offset = (new Date(Date.UTC(year, m, 1)).getUTCDay() + 6) % 7;
        const cells: (string | null)[] = Array(offset).fill(null);
        for (let d = 1; d <= count; d++) cells.push(key(new Date(Date.UTC(year, m, d))));
        while (cells.length % 7) cells.push(null);
        const rows = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
        return { name: name.charAt(0).toUpperCase() + name.slice(1), rows };
      }),
    [year, lang],
  );

  const size = CELL;

  const selectedInfo = useMemo(() => {
    if (!selected) return null;
    const date = new Date(`${selected}T00:00:00Z`).toLocaleDateString(lang, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    return format(t.stHeatmapDay, {
      date,
      calories: Math.round(levels.get(selected)?.calories ?? 0),
    });
  }, [selected, levels, lang, t]);

  return (
    <View className="gap-3">
      <SectionHeader title={t.stHeatmapTitle} />
      <View className="gap-3 rounded-card bg-surface px-3 py-5">
        <View className="flex-row items-center justify-between">
          <IconButton icon="chevron-back" label={String(year - 1)} onPress={() => setYear((y) => y - 1)} />
          <Text className="text-base font-semibold text-ink">{year}</Text>
          <IconButton
            icon="chevron-forward"
            label={String(year + 1)}
            onPress={() => setYear((y) => Math.min(thisYear, y + 1))}
          />
        </View>
        <View className="flex-row flex-wrap justify-center" style={{ gap: MONTH_GAP }}>
          {months.map(({ name, rows }) => (
            <View key={name} style={{ gap: 6 }}>
              <Text numberOfLines={1} className="text-xs font-medium text-ink-muted">
                {name}
              </Text>
              <View style={{ gap: GAP }}>
                {rows.map((row, r) => (
                  <View key={r} className="flex-row" style={{ gap: GAP }}>
                    {row.map((day, d) => {
                      const level = day ? (levels.get(day)?.level ?? 0) : -1;
                      const isSelected = day != null && day === selected;
                      return (
                        <Pressable
                          key={d}
                          disabled={!day}
                          hitSlop={2}
                          onPress={() => day && setSelected(isSelected ? null : day)}
                          accessibilityRole="button"
                          accessibilityLabel={day ?? undefined}
                          style={{
                            width: size,
                            height: size,
                            borderRadius: 3,
                            borderWidth: isSelected ? 1.5 : 0,
                            borderColor: WorkoutTheme.text.primary,
                            backgroundColor:
                              level < 0
                                ? "transparent"
                                : withAlpha(WorkoutTheme.accent.purple, ALPHAS[Math.min(level, 4)]),
                          }}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="flex-1 text-xs font-medium text-ink" numberOfLines={1}>
            {selectedInfo ?? ""}
          </Text>
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
