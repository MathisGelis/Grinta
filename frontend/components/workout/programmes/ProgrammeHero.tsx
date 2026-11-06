import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import type { SmallProgramm } from "@/services/programms.service";
import Card from "@/components/ui/Card";
import PressableScale from "@/components/ui/PressableScale";

const SIZE = 76;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  programme: SmallProgramm;
  dayNumber: number;
};

function ProgrammeHero({ programme, dayNumber }: Props) {
  const { t } = useTranslation();
  const total = Math.max(programme.totalDays, 1);
  const progress = Math.min(dayNumber / total, 1);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={programme.title}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/workouts/programme-detail",
          params: { programmeId: programme.id },
        } as any)
      }
    >
      <Card size="hero" tone="accent" className="flex-row items-center gap-4 p-6">
        <View className="flex-1 gap-1">
          <Text className="text-sm text-on-accent opacity-70">
            {format(t.dayN, { n: dayNumber })}
          </Text>
          <Text
            numberOfLines={2}
            className="text-2xl font-semibold tracking-tight text-on-accent"
          >
            {programme.title}
          </Text>
          <View className="mt-3 h-11 w-11 items-center justify-center rounded-full bg-accent-dark">
            <Ionicons name="arrow-up" size={20} color={WorkoutTheme.text.primary} style={{ transform: [{ rotate: "45deg" }] }} />
          </View>
        </View>

        <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
          <Svg width={SIZE} height={SIZE} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={withAlpha(WorkoutTheme.text.primary, 0.25)}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={WorkoutTheme.text.primary}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
              fill="none"
            />
          </Svg>
          <Text
            className="text-lg font-semibold text-on-accent"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {dayNumber}
            <Text className="text-sm font-normal opacity-70">/{total}</Text>
          </Text>
        </View>
      </Card>
    </PressableScale>
  );
}

export default React.memo(ProgrammeHero);
