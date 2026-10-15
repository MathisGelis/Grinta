import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import Glass from "@/components/ui/Glass";
import SegmentedControl from "@/components/ui/SegmentedControl";
import PressableScale from "@/components/ui/PressableScale";

const WEEK_HEIGHT = 76;
const MONTH_HEADER_HEIGHT = 16;

export type CalendarView = "week" | "month";

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekOf(date: Date) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function monthRows(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array((first.getDay() + 6) % 7).fill(null);
  for (let d = 1; d <= count; d++) {
    cells.push(new Date(date.getFullYear(), date.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, r) =>
    cells.slice(r * 7, r * 7 + 7),
  );
}

type Props = {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  anchor: Date;
  selected: Date;
  onSelect: (date: Date) => void;
  onShift: (direction: -1 | 1) => void;
  workoutDays: Set<string>;
};

export default function StatsCalendar({
  view,
  onViewChange,
  anchor,
  selected,
  onSelect,
  onShift,
  workoutDays,
}: Props) {
  const { t } = useTranslation();
  const todayKey = dayKey(new Date());
  const selectedKey = dayKey(selected);
  const labelDate = view === "week" ? weekOf(anchor)[3] : anchor;
  const monthLabel = `${t.months[labelDate.getMonth()]} ${labelDate.getFullYear()}`;

  const rows = monthRows(anchor).length;
  const targetHeight =
    view === "week" ? WEEK_HEIGHT : MONTH_HEADER_HEIGHT + 48 * rows - 2;
  const height = useSharedValue(targetHeight);
  useEffect(() => {
    height.value = withTiming(targetHeight, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetHeight, height]);
  const gridStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <View className="gap-4">
      <View className="flex-row items-center">
        <View className="flex-1 flex-row">
          <Glass className="h-12 flex-row rounded-full">
            <ArrowButton
              icon="chevron-back"
              label={view === "week" ? t.prevWeek : t.prevMonth}
              onPress={() => onShift(-1)}
            />
            <ArrowButton
              icon="chevron-forward"
              label={view === "week" ? t.nextWeek : t.nextMonth}
              onPress={() => onShift(1)}
            />
          </Glass>
        </View>
        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
          {monthLabel}
        </Text>
        <View className="flex-1 items-end">
          <SegmentedControl<CalendarView>
            variant="glass"
            id="stats-view"
            className="w-[96px]"
            value={view}
            onChange={onViewChange}
            options={[
              { value: "week", label: t.viewWeek, icon: "reorder-two-outline" },
              { value: "month", label: t.viewMonth, icon: "grid-outline" },
            ]}
          />
        </View>
      </View>

      <Animated.View
        style={[
          gridStyle,
          { overflow: "hidden", marginBottom: view === "month" ? -26 : 0 },
        ]}
      >
        {view === "week" ? (
          <View className="flex-row justify-between">
            {weekOf(anchor).map((date, i) => {
              const key = dayKey(date);
              const isSelected = key === selectedKey;
              const done = workoutDays.has(key);
              return (
                <PressableScale
                  key={key}
                  onPress={() => onSelect(date)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${t.days[i]} ${date.getDate()}${done ? ` – ${t.completedLabel}` : ""}`}
                  className="h-[76px] w-[44px] items-center justify-center gap-1"
                >
                  <DayBackdrop
                    selected={isSelected}
                    done={done}
                    today={key === todayKey}
                    filled
                  />
                  <Text
                    className={`text-xs ${isSelected || done ? "text-ink" : "text-ink-muted"}`}
                  >
                    {t.days[i]}
                  </Text>
                  <Text
                    className={`text-base font-semibold ${isSelected || done ? "text-ink" : "text-ink-soft"}`}
                  >
                    {date.getDate()}
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={
                      isSelected
                        ? WorkoutTheme.text.primary
                        : WorkoutTheme.accent.purple
                    }
                    style={{ opacity: done ? 1 : 0 }}
                  />
                </PressableScale>
              );
            })}
          </View>
        ) : (
          <View className="gap-1">
            <View className="flex-row">
              {t.days.map((label, i) => (
                <Text
                  key={i}
                  className="w-[14.2857%] text-center text-xs text-ink-muted"
                >
                  {label}
                </Text>
              ))}
            </View>
            {monthRows(anchor).map((row, r) => (
              <View key={r} className="flex-row">
                {row.map((date, c) => {
                  if (!date)
                    return <View key={c} className="h-11 w-[14.2857%]" />;
                  const key = dayKey(date);
                  const isSelected = key === selectedKey;
                  const done = workoutDays.has(key);
                  return (
                    <View
                      key={c}
                      className="h-11 w-[14.2857%] items-center justify-center"
                    >
                      <PressableScale
                        onPress={() => onSelect(date)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`${date.getDate()} ${t.months[date.getMonth()]}${done ? ` – ${t.completedLabel}` : ""}`}
                        className="h-10 w-10 items-center justify-center"
                      >
                        <DayBackdrop
                          selected={isSelected}
                          done={done}
                          today={key === todayKey}
                        />
                        <Text
                          className={`text-sm ${isSelected || done ? "font-semibold text-ink" : "text-ink-soft"}`}
                        >
                          {date.getDate()}
                        </Text>
                        {done && (
                          <View className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background">
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color={WorkoutTheme.accent.purple}
                            />
                          </View>
                        )}
                      </PressableScale>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function DayBackdrop({
  selected,
  done,
  today,
  filled = false,
}: {
  selected: boolean;
  done: boolean;
  today: boolean;
  filled?: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      className={`absolute inset-0 rounded-full border ${
        selected
          ? "border-accent bg-accent"
          : done
            ? `border-accent ${today ? "bg-accent/30" : filled ? "bg-surface" : ""}`
            : today
              ? "border-transparent bg-accent/30"
              : `border-transparent ${filled ? "bg-surface" : ""}`
      }`}
    />
  );
}

function ArrowButton({
  icon,
  label,
  onPress,
}: {
  icon: "chevron-back" | "chevron-forward";
  label: string;
  onPress: () => void;
}) {
  const pressed = useSharedValue(0);
  const halo = useAnimatedStyle(() => ({ opacity: pressed.get() }));
  const fade = (to: number, duration: number) =>
    withTiming(to, { duration, easing: Easing.out(Easing.quad) });

  return (
    <PressableScale
      onPress={onPress}
      halo={false}
      onPressIn={() => {
        pressed.set(fade(1, 90));
      }}
      onPressOut={() => {
        pressed.set(fade(0, 180));
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-full w-11 items-center justify-center"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: withAlpha(WorkoutTheme.text.primary, 0.15),
          },
          halo,
        ]}
      />
      <Ionicons name={icon} size={20} color={WorkoutTheme.text.primary} />
    </PressableScale>
  );
}
