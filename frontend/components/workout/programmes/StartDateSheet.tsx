import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Modal from "@/components/ui/AppModal";
import Button from "@/components/ui/Button";
import PressableScale from "@/components/ui/PressableScale";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { formatDate } from "@/utils/formatDate";
import { localDate } from "@/utils/date";

type Props = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  /** Nombre de jours du programme : permet de choisir le jour de départ. */
  dayCount?: number;
  /** Date choisie (AAAA-MM-JJ, jour local) et jour du programme qui lui correspond (1 = début). */
  onConfirm: (date: string, startDay: number) => void;
};

/** Le serveur n'accepte qu'une date à 7 jours au plus d'aujourd'hui, avant ou après (B-03). */
const WINDOW_DAYS = 7;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function monthCells(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array((first.getDay() + 6) % 7).fill(null);
  for (let d = 1; d <= count; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Alerte « Commencer ce programme » : calendrier pour choisir le jour de début (aujourd'hui ou plus tard). */
export default function StartDateSheet({ visible, loading, onClose, dayCount = 0, onConfirm }: Props) {
  const { t, lang } = useTranslation();
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [month, setMonth] = useState(() => startOfDay(new Date()));
  const [startDay, setStartDay] = useState(1);

  useEffect(() => {
    if (!visible) return;
    const today = startOfDay(new Date());
    setSelected(today);
    setMonth(today);
    setStartDay(1);
  }, [visible]);

  const today = startOfDay(new Date());
  const selectedKey = localDate(selected);
  const todayKey = localDate(today);
  const cells = monthCells(month);
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - WINDOW_DAYS);
  const maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + WINDOW_DAYS);
  const minKey = localDate(minDate);
  const maxKey = localDate(maxDate);
  const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const canGoBack = monthIndex(month) > monthIndex(minDate);
  const canGoForward = monthIndex(month) < monthIndex(maxDate);
  // Lundi → dimanche (2024-01-01 est un lundi).
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    formatDate(new Date(2024, 0, 1 + i), lang, "weekdayNarrow"),
  );
  const shift = (dir: -1 | 1) => setMonth(new Date(month.getFullYear(), month.getMonth() + dir, 1));

  return (
    <Modal
      isVisible={visible}
      animationIn="fadeIn"
      onBackdropPress={onClose}
      style={{ justifyContent: "center", margin: 20 }}
    >
      <View className="gap-4 rounded-card bg-surface p-5">
        <Text className="text-center text-base font-semibold text-ink">{t.prgPickStartDate}</Text>

        <View className="flex-row items-center justify-between">
          <PressableScale
            halo={false}
            hitSlop={12}
            disabled={!canGoBack}
            onPress={() => shift(-1)}
            accessibilityRole="button"
            accessibilityLabel={t.prevMonth}
            className={canGoBack ? "" : "opacity-30"}
          >
            <Ionicons name="chevron-back" size={22} color={WorkoutTheme.text.primary} />
          </PressableScale>
          <Text className="text-base font-semibold capitalize text-ink">
            {formatDate(month, lang, "month")}
          </Text>
          <PressableScale
            halo={false}
            hitSlop={12}
            disabled={!canGoForward}
            onPress={() => shift(1)}
            accessibilityRole="button"
            accessibilityLabel={t.nextMonth}
            className={canGoForward ? "" : "opacity-30"}
          >
            <Ionicons name="chevron-forward" size={22} color={WorkoutTheme.text.primary} />
          </PressableScale>
        </View>

        <View>
          <View className="mb-1 flex-row">
            {weekdays.map((label, i) => (
              <Text key={i} className="flex-1 text-center text-xs font-semibold text-ink-muted">
                {label}
              </Text>
            ))}
          </View>
          <View className="flex-row flex-wrap">
            {cells.map((date, i) => {
              const key = date ? localDate(date) : "";
              const isSelected = key === selectedKey;
              const outOfRange = !!date && (key < minKey || key > maxKey);
              return (
                <View key={i} style={{ width: `${100 / 7}%` }} className="items-center py-0.5">
                  {date ? (
                    <PressableScale
                      halo={false}
                      disabled={outOfRange}
                      onPress={() => setSelected(date)}
                      className={`h-10 w-10 items-center justify-center rounded-full ${isSelected ? "bg-accent" : ""}`}
                    >
                      <Text
                        className={`text-sm ${isSelected ? "font-bold text-ink" : outOfRange ? "text-ink-faint" : key === todayKey ? "font-bold text-accent-light" : "text-ink"}`}
                      >
                        {date.getDate()}
                      </Text>
                    </PressableScale>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {dayCount > 1 ? (
          <View className="flex-row items-center justify-between rounded-tile bg-raised px-4 py-2">
            <Text className="text-sm text-ink-soft">{t.prgStartDayLabel}</Text>
            <View className="flex-row items-center gap-3">
              <PressableScale
                halo={false}
                hitSlop={10}
                disabled={startDay <= 1}
                onPress={() => setStartDay((d) => Math.max(1, d - 1))}
                accessibilityRole="button"
                accessibilityLabel="-"
                className={startDay <= 1 ? "opacity-30" : ""}
              >
                <Ionicons name="remove-circle-outline" size={26} color={WorkoutTheme.text.primary} />
              </PressableScale>
              <Text className="min-w-[28px] text-center text-base font-semibold text-ink" style={{ fontVariant: ["tabular-nums"] }}>
                {startDay}
              </Text>
              <PressableScale
                halo={false}
                hitSlop={10}
                disabled={startDay >= dayCount}
                onPress={() => setStartDay((d) => Math.min(dayCount, d + 1))}
                accessibilityRole="button"
                accessibilityLabel="+"
                className={startDay >= dayCount ? "opacity-30" : ""}
              >
                <Ionicons name="add-circle-outline" size={26} color={WorkoutTheme.text.primary} />
              </PressableScale>
            </View>
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <Button className="flex-1" variant="secondary" label={t.cancel} onPress={onClose} />
          <Button
            className="flex-1"
            label={t.prgStartDay}
            loading={loading}
            onPress={() => onConfirm(selectedKey, startDay)}
          />
        </View>
      </View>
    </Modal>
  );
}
