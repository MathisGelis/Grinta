import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { getProgrammeById, type ProgrammeDay, type SmallProgramm } from "@/services/programms.service";
import { localDate } from "@/utils/date";
import Card from "@/components/ui/Card";
import PressableScale from "@/components/ui/PressableScale";
import { formatDate } from "@/utils/formatDate";

const SIZE = 76;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  programme: SmallProgramm;
  dayNumber: number;
  /** Jour de début du programme suivi (AAAA-MM-JJ) : les jours avant n'ont pas de séance. */
  startedOn?: string;
};

const DAY_MS = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const STRIP_DAYS = 60;
const STRIP_GAP = 4;

/** Jours à venir (à partir d'aujourd'hui), défilables horizontalement : séance ou repos pour chacun. */
function DaysStrip({
  programmeId,
  dayNumber,
  startedOn,
}: {
  programmeId: string;
  dayNumber: number;
  startedOn?: string;
}) {
  const { lang } = useTranslation();
  const [days, setDays] = useState<ProgrammeDay[]>([]);
  const [width, setWidth] = useState(0);
  // Un appui sur un jour ouvre le programme ; le défilement horizontal reste possible.
  const openProgramme = () =>
    router.push({
      pathname: "/(tabs)/workouts/programme-detail",
      params: { programmeId },
    } as any);

  useEffect(() => {
    let cancelled = false;
    getProgrammeById(programmeId)
      .then((p) => !cancelled && setDays(p.days ?? []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [programmeId]);

  const today = startOfDay(new Date());
  // 7 jours visibles à la fois.
  const cellWidth = width > 0 ? (width - STRIP_GAP * 6) / 7 : 40;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: STRIP_GAP }}
      >
        {Array.from({ length: STRIP_DAYS }, (_, diff) => {
          const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
          const length = days.length;
          const started = !startedOn || localDate(date) >= startedOn.slice(0, 10);
          const entry =
            length > 0 && started ? days[(dayNumber - 1 + diff) % length] : undefined;
          const isToday = diff === 0;
          const fg = isToday ? WorkoutTheme.accent.purple : WorkoutTheme.text.primary;
          return (
            <PressableScale
              key={diff}
              bounce={false}
              halo={false}
              onPress={openProgramme}
              accessibilityRole="button"
              style={{ width: cellWidth }}
              className={`items-center gap-1 rounded-tile py-2 ${isToday ? "bg-white" : ""}`}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: fg, opacity: isToday ? 1 : 0.7 }}
              >
                {formatDate(date, lang, "weekdayNarrow").toUpperCase()}
              </Text>
              <View className="h-4 items-center justify-center">
                {entry?.workout ? (
                  <Ionicons name="barbell-outline" size={14} color={fg} />
                ) : entry ? (
                  <MaterialCommunityIcons name="sleep" size={14} color={fg} />
                ) : null}
              </View>
              <Text
                className="text-xs font-semibold"
                style={{ color: fg, fontVariant: ["tabular-nums"] }}
              >
                {date.getDate()}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ProgrammeHero({ programme, dayNumber, startedOn }: Props) {
  const { t } = useTranslation();
  const total = Math.max(programme.totalDays, 1);
  const progress = Math.min(dayNumber / total, 1);

  return (
    <Card size="hero" tone="accent" className="gap-4 p-6">
      <PressableScale
        bounce={false}
        halo={false}
        accessibilityRole="button"
        accessibilityLabel={programme.title}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/workouts/programme-detail",
            params: { programmeId: programme.id },
          } as any)
        }
      >
        <View className="flex-row items-center gap-4">
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
        </View>
      </PressableScale>
      <DaysStrip programmeId={programme.id} dayNumber={dayNumber} startedOn={startedOn} />
    </Card>
  );
}

export default React.memo(ProgrammeHero);

/** Même emplacement et même taille que le programme en cours, en pointillé quand il n'y en a aucun. */
export function ProgrammeHeroEmpty({ onChoose }: { onChoose: () => void }) {
  const { t } = useTranslation();
  return (
    <PressableScale
      accessibilityRole="button"
      bounce={false}
      accessibilityLabel={t.prgChooseToStart}
      onPress={onChoose}
      style={{
        height: 216, // ≈ hauteur de la carte du programme en cours (titre + semaine)
        borderCurve: "continuous",
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: withAlpha(WorkoutTheme.text.primary, 0.3),
      }}
      className="flex-row items-center gap-4 rounded-hero px-6"
    >
      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-ink">{t.prgNoneActive}</Text>
        <Text className="text-sm text-ink-muted">{t.prgChooseToStart}</Text>
      </View>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-accent">
        <Ionicons name="add" size={26} color={WorkoutTheme.text.primary} />
      </View>
    </PressableScale>
  );
}
