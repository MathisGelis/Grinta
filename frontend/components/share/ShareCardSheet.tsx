import React, { useEffect, useRef, useState } from "react";
import { Alert, Text, View, ScrollView, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import Svg, { Defs, Pattern, Rect } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import Modal from "@/components/ui/AppModal";
import Button from "@/components/ui/Button";
import PressableScale from "@/components/ui/PressableScale";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format, type Strings } from "@/i18n/translations";
import { mediaUrl } from "@/services/api";
import { realLifeText, type RealLifeComparison } from "@/utils/realLife";

export type ShareCardData = {
  title: string;
  /** Pseudo affiché à droite du logo (sans le @). */
  username?: string;
  /** Photo de la séance, si elle en a une. */
  photoUrl?: string | null;
  durationSeconds?: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  records?: number;
  realLife?: RealLifeComparison | null;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
};

type Props = {
  visible: boolean;
  data: ShareCardData | null;
  onClose: () => void;
};

type Layout = "classic" | "minimal" | "poster" | "top" | "sets";
type Background = "dark" | "light" | "transparent" | "photo";

const LAYOUTS: Layout[] = ["classic", "minimal", "poster", "top", "sets"];
const PAGE_GAP = 8;
const MAX_SETS_EXERCISES = 6;
const MAX_SETS_PER_EXERCISE = 6;
const MAX_TOP_LIFTS = 4;
const CHECKER = 12;

const volume = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)} T` : `${Math.round(kg)} kg`;

const bestSet = (sets: { weight: number; reps: number }[]) =>
  sets.reduce<{ weight: number; reps: number } | null>(
    (acc, set) =>
      !acc || set.weight > acc.weight || (set.weight === acc.weight && set.reps > acc.reps)
        ? set
        : acc,
    null,
  );

type Theme = { text: string; soft: string; tile: string; accent: string; shadow: boolean };

const THEMES: Record<Background, Theme> = {
  dark: {
    text: WorkoutTheme.text.primary,
    soft: WorkoutTheme.text.secondary,
    tile: withAlpha(WorkoutTheme.background, 0.45),
    accent: WorkoutTheme.accent.purpleLight,
    shadow: false,
  },
  // Fond clair : les couleurs du thème sombre inversées.
  light: {
    text: WorkoutTheme.background,
    soft: WorkoutTheme.backgroundTertiary,
    tile: withAlpha(WorkoutTheme.background, 0.08),
    accent: WorkoutTheme.accent.purpleDark,
    shadow: false,
  },
  transparent: {
    text: WorkoutTheme.text.primary,
    soft: WorkoutTheme.text.primary,
    tile: withAlpha(WorkoutTheme.background, 0.55),
    accent: WorkoutTheme.accent.purpleLight,
    shadow: true,
  },
  photo: {
    text: WorkoutTheme.text.primary,
    soft: WorkoutTheme.text.primary,
    tile: withAlpha(WorkoutTheme.background, 0.5),
    accent: WorkoutTheme.accent.purpleLight,
    shadow: true,
  },
};

type LayoutProps = {
  data: ShareCardData;
  theme: Theme;
  shadow?: object;
  t: Strings;
};

function Header({ data, theme, shadow }: LayoutProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 24, height: 24, borderRadius: 7 }}
          accessibilityLabel="Grinta"
        />
        <Text className="text-sm font-semibold" style={[{ color: theme.text }, shadow]}>
          Grinta
        </Text>
      </View>
      {data.username ? (
        <Text className="text-sm font-medium" style={[{ color: theme.soft }, shadow]} numberOfLines={1}>
          @{data.username}
        </Text>
      ) : null}
    </View>
  );
}

function RecordsLine({ data, theme, shadow, t }: LayoutProps) {
  const comparison = realLifeText(t, data.realLife);
  if (!comparison && !data.records) return null;
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name="trophy" size={16} color={theme.accent} />
      <Text className="flex-1 text-sm font-medium" style={[{ color: theme.text }, shadow]}>
        {[data.records ? `${data.records} ${t.pcRecords.toLowerCase()}` : null, comparison]
          .filter(Boolean)
          .join(" · ")}
      </Text>
    </View>
  );
}

/** Ligne « durée · séries · reps » sous le titre. */
const infoLine = (data: ShareCardData, t: Strings) =>
  [
    data.durationSeconds != null ? `${Math.round(data.durationSeconds / 60)} min` : null,
    format(t.pcSetsCount, { n: data.totalSets }),
    `${data.totalReps} ${t.repsLabel.toLowerCase()}`,
  ]
    .filter(Boolean)
    .join(" · ");

/** Les chiffres en clair (sans badges) au centre, titre et ligne séries/reps en bas de la card. */
function ClassicLayout(props: LayoutProps) {
  const { data, theme, shadow, t } = props;
  return (
    <View className="flex-1 justify-between p-6">
      <Header {...props} />
      <View className="w-full flex-row flex-wrap justify-center gap-y-8">
        {[
          data.durationSeconds != null
            ? { label: t.duration, value: `${Math.round(data.durationSeconds / 60)} min` }
            : null,
          { label: t.pcVolume, value: volume(data.totalVolume) },
          { label: t.sets, value: String(data.totalSets) },
          { label: t.repsLabel, value: String(data.totalReps) },
        ]
          .filter((stat): stat is { label: string; value: string } => !!stat)
          .map((stat) => (
            <View key={stat.label} className="items-center" style={{ width: "50%" }}>
              <Text className="text-4xl font-bold" style={[{ color: theme.text }, shadow]}>
                {stat.value}
              </Text>
              <Text className="mt-0.5 text-xs" style={[{ color: theme.soft }, shadow]}>
                {stat.label}
              </Text>
            </View>
          ))}
      </View>
      <View className="items-center">
        <Text
          className="text-center text-xl font-semibold"
          style={[{ color: theme.text }, shadow]}
          numberOfLines={2}
        >
          {data.title}
        </Text>
      </View>
    </View>
  );
}

/** Card épurée : uniquement le nom de la séance et sa ligne « durée · séries · reps ». */
function MinimalLayout(props: LayoutProps) {
  const { data, theme, shadow, t } = props;
  return (
    <View className="flex-1 justify-between p-6">
      <Header {...props} />
      <View className="items-center gap-2 px-2">
        <Text
          className="text-center text-3xl font-bold"
          style={[{ color: theme.text }, shadow]}
          numberOfLines={3}
        >
          {data.title}
        </Text>
        <Text className="text-center text-sm" style={[{ color: theme.soft }, shadow]}>
          {infoLine(data, t)}
        </Text>
      </View>
      <View />
    </View>
  );
}

/** Liste des exercices, avec toutes leurs séries en texte simple (sans pastilles). */
function SetsLayout(props: LayoutProps) {
  const { data, theme, shadow, t } = props;
  return (
    <View className="flex-1 justify-between gap-4 p-6">
      <Header {...props} />
      <View className="gap-4">
        <Text className="text-2xl font-semibold" style={[{ color: theme.text }, shadow]} numberOfLines={2}>
          {data.title}
        </Text>
        <View className="gap-2.5">
          {data.exercises.slice(0, MAX_SETS_EXERCISES).map((exercise, index) => (
            <View key={`${exercise.name}-${index}`} className="gap-0.5">
              <Text className="text-sm font-semibold" style={[{ color: theme.text }, shadow]} numberOfLines={1}>
                {exercise.name}
              </Text>
              <Text className="text-xs" style={[{ color: theme.soft }, shadow]} numberOfLines={2}>
                {exercise.sets
                  .slice(0, MAX_SETS_PER_EXERCISE)
                  .map((set) => `${set.weight} × ${set.reps}`)
                  .join(" · ")}
                {exercise.sets.length > MAX_SETS_PER_EXERCISE
                  ? ` · ${format(t.shrMoreSets, { n: exercise.sets.length - MAX_SETS_PER_EXERCISE })}`
                  : ""}
              </Text>
            </View>
          ))}
          {data.exercises.length > MAX_SETS_EXERCISES ? (
            <Text className="text-xs" style={[{ color: theme.soft }, shadow]}>
              {format(t.pcMoreExercises, { n: data.exercises.length - MAX_SETS_EXERCISES })}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** Un seul chiffre en grand : le volume total, avec la comparaison avec la vie réelle. */
function PosterLayout(props: LayoutProps) {
  const { data, theme, shadow, t } = props;
  const comparison = realLifeText(t, data.realLife);
  const footer = [
    data.durationSeconds != null ? `${Math.round(data.durationSeconds / 60)} min` : null,
    format(t.pcSetsCount, { n: data.totalSets }),
    `${data.totalReps} ${t.repsLabel.toLowerCase()}`,
  ].filter(Boolean);
  return (
    <View className="flex-1 justify-between p-6">
      <Header {...props} />
      <View className="items-center gap-2">
        <Text className="text-xs font-semibold uppercase" style={[{ color: theme.soft }, shadow]}>
          {t.shrVolumeBig}
        </Text>
        <Text
          className="text-center font-bold"
          style={[{ color: theme.text, fontSize: 68, lineHeight: 76 }, shadow]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {volume(data.totalVolume)}
        </Text>
        {comparison ? (
          <View className="mt-1 rounded-full px-4 py-2" style={{ backgroundColor: theme.tile }}>
            <Text className="text-sm font-semibold" style={{ color: theme.accent }}>
              {comparison}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="items-center gap-1">
        <Text className="text-xl font-semibold" style={[{ color: theme.text }, shadow]} numberOfLines={2}>
          {data.title}
        </Text>
        <Text className="text-xs" style={[{ color: theme.soft }, shadow]}>
          {footer.join(" · ")}
        </Text>
      </View>
    </View>
  );
}

/** Classement des plus grosses charges, au même format de liste que les autres cards. */
function TopLayout(props: LayoutProps) {
  const { data, theme, shadow } = props;
  const lifts = data.exercises
    .map((exercise) => ({ name: exercise.name, best: bestSet(exercise.sets) }))
    .filter((lift): lift is { name: string; best: { weight: number; reps: number } } => !!lift.best)
    .sort((a, b) => b.best.weight - a.best.weight || b.best.reps - a.best.reps)
    .slice(0, MAX_TOP_LIFTS);
  return (
    <View className="flex-1 justify-between gap-4 p-6">
      <Header {...props} />
      <View className="gap-4">
        <Text className="text-2xl font-semibold" style={[{ color: theme.text }, shadow]} numberOfLines={2}>
          {data.title}
        </Text>
        <View className="gap-1.5">
          {lifts.map((lift, index) => (
            <View key={`${lift.name}-${index}`} className="flex-row items-center gap-3">
              <Text className="flex-1 text-sm" style={[{ color: theme.text }, shadow]} numberOfLines={1}>
                {index + 1}. {lift.name}
              </Text>
              <Text className="text-xs" style={[{ color: theme.soft }, shadow]}>
                {lift.best.weight} kg × {lift.best.reps}
              </Text>
            </View>
          ))}
        </View>
        <RecordsLine {...props} />
      </View>
    </View>
  );
}

const RENDER: Record<Layout, (props: LayoutProps) => React.ReactElement> = {
  classic: ClassicLayout,
  minimal: MinimalLayout,
  sets: SetsLayout,
  poster: PosterLayout,
  top: TopLayout,
};

/** Damier derrière une card transparente, comme dans un éditeur d'images (hors de la capture). */
function Checkerboard({ size = CHECKER, id = "checker" }: { size?: number; id?: string }) {
  return (
    <Svg width="100%" height="100%" style={{ position: "absolute" }}>
      <Defs>
        <Pattern id={id} width={size * 2} height={size * 2} patternUnits="userSpaceOnUse">
          <Rect width={size * 2} height={size * 2} fill={WorkoutTheme.backgroundTertiary} />
          <Rect width={size} height={size} fill={WorkoutTheme.border} />
          <Rect x={size} y={size} width={size} height={size} fill={WorkoutTheme.border} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Pastille ronde du choix de fond : la couleur choisie, avec son nom en dessous. */
function Swatch({
  background,
  label,
  active,
  photo,
  onPress,
}: {
  background: Background;
  label: string;
  active: boolean;
  photo?: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      halo={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      className="items-center gap-1.5"
    >
      <View
        className="h-14 w-14 items-center justify-center overflow-hidden rounded-full"
        style={{
          borderWidth: 2,
          borderColor: active ? WorkoutTheme.accent.purple : WorkoutTheme.border,
        }}
      >
        {background === "dark" ? (
          <LinearGradient
            colors={[WorkoutTheme.accent.purpleDark, WorkoutTheme.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", inset: 0 }}
          />
        ) : null}
        {background === "light" ? (
          <View style={{ position: "absolute", inset: 0, backgroundColor: WorkoutTheme.text.primary }} />
        ) : null}
        {background === "transparent" ? <Checkerboard size={6} id="swatch-checker" /> : null}
        {background === "photo" ? (
          <>
            {photo ? (
              <Image
                source={{ uri: photo }}
                cachePolicy="disk"
                contentFit="cover"
                style={{ position: "absolute", inset: 0 }}
              />
            ) : null}
            <View
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: withAlpha(WorkoutTheme.background, 0.45),
              }}
            />
            <Ionicons name="image-outline" size={22} color={WorkoutTheme.text.primary} />
          </>
        ) : null}
      </View>
      <Text className={`text-xs ${active ? "font-semibold text-ink" : "text-ink-muted"}`}>{label}</Text>
    </PressableScale>
  );
}

/** Cards dessinées dans l'app (carrousel de 4 designs) puis capturées en PNG et envoyées au partage natif. */
export default function ShareCardSheet({ visible, data, onClose }: Props) {
  const { t } = useTranslation();
  const refs = useRef<(React.ComponentRef<typeof View> | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const [background, setBackground] = useState<Background>("dark");

  const photo = mediaUrl(data?.photoUrl);

  // Sans photo, ce fond n'existe pas : on revient au sombre.
  useEffect(() => {
    if (!photo && background === "photo") setBackground("dark");
  }, [photo, background]);

  const names: Record<Layout, string> = {
    classic: t.shrTypeSummary,
    minimal: t.shrLayoutMinimal,
    sets: t.shrTypeSets,
    poster: t.shrLayoutPoster,
    top: t.shrLayoutTop,
  };

  const share = async () => {
    const target = refs.current[page];
    if (!target) return;
    try {
      setBusy(true);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t.error, t.shrCardUnavailable);
        return;
      }
      const uri = await captureRef(target as Parameters<typeof captureRef>[0], {
        format: "png",
        quality: 1,
      });
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.shrCardUnavailable);
    } finally {
      setBusy(false);
    }
  };

  const theme = THEMES[background];
  const shadow = theme.shadow
    ? { textShadowColor: "rgba(0,0,0,0.55)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } }
    : undefined;

  const backgrounds: { value: Background; label: string }[] = [
    { value: "dark", label: t.shrBgDark },
    { value: "light", label: t.shrBgLight },
    { value: "transparent", label: t.shrBgTransparent },
    ...(photo ? [{ value: "photo" as const, label: t.shrBgPhoto }] : []),
  ];

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // La card (4:5) s'adapte à la hauteur de l'écran : la feuille tient en entier,
  // le bouton de partage n'est jamais coupé.
  const chrome = insets.top + 24 + 24 + 52 + 96 + 52 + 14 * 4 + insets.bottom + 20;
  const cardWidth = Math.max(
    160,
    Math.min(width, Math.floor(((windowHeight - chrome) * 4) / 5)),
  );
  const cardHeight = (cardWidth * 5) / 4;
  const sidePadding = Math.max(0, (width - cardWidth) / 2);

  return (
    <Modal
      isVisible={visible && !!data}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={{ justifyContent: "flex-end" }}
    >
      <View
        className="rounded-t-hero bg-surface px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-raised" />
        <View className="gap-3.5">
          <View onLayout={onLayout} style={{ height: cardHeight || undefined }}>
            {data && width > 0 ? (
              <ScrollView
                horizontal
                nestedScrollEnabled
                decelerationRate="fast"
                snapToInterval={cardWidth + PAGE_GAP}
                snapToAlignment="start"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: sidePadding, gap: PAGE_GAP }}
                onMomentumScrollEnd={(e) =>
                  setPage(
                    Math.min(
                      LAYOUTS.length - 1,
                      Math.max(0, Math.round(e.nativeEvent.contentOffset.x / (cardWidth + PAGE_GAP))),
                    ),
                  )
                }
              >
                {LAYOUTS.map((layout, index) => {
                  const Content = RENDER[layout];
                  return (
                    <View
                      key={layout}
                      className="overflow-hidden rounded-card"
                      style={{ width: cardWidth, height: cardHeight }}
                    >
                      {background === "transparent" ? <Checkerboard id={`checker-${layout}`} /> : null}
                      <View
                        ref={(node) => {
                          refs.current[index] = node;
                        }}
                        collapsable={false}
                        style={{ width: cardWidth, height: cardHeight }}
                      >
                        {background === "dark" ? (
                          <LinearGradient
                            colors={[WorkoutTheme.accent.purpleDark, WorkoutTheme.background]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: "absolute", inset: 0 }}
                          />
                        ) : null}
                        {background === "light" ? (
                          <View
                            style={{ position: "absolute", inset: 0, backgroundColor: WorkoutTheme.text.primary }}
                          />
                        ) : null}
                        {background === "photo" && photo ? (
                          <>
                            <Image
                              source={{ uri: photo }}
                              cachePolicy="disk"
                              contentFit="cover"
                              style={{ position: "absolute", inset: 0 }}
                            />
                            <LinearGradient
                              colors={[
                                withAlpha(WorkoutTheme.background, 0.35),
                                withAlpha(WorkoutTheme.background, 0.8),
                              ]}
                              style={{ position: "absolute", inset: 0 }}
                            />
                          </>
                        ) : null}
                        <Content data={data} theme={theme} shadow={shadow} t={t} />
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>

          <View className="items-center gap-2">
            <Text className="text-sm font-medium text-ink-soft">{names[LAYOUTS[page]]}</Text>
            <View className="flex-row gap-1.5">
              {LAYOUTS.map((layout, index) => (
                <View
                  key={layout}
                  className={`h-1.5 rounded-full ${index === page ? "w-4 bg-accent" : "w-1.5 bg-raised"}`}
                />
              ))}
            </View>
          </View>

          <View className="flex-row items-start justify-center gap-5 py-3">
            {backgrounds.map((option) => (
              <Swatch
                key={option.value}
                background={option.value}
                label={option.label}
                active={background === option.value}
                photo={photo}
                onPress={() => setBackground(option.value)}
              />
            ))}
          </View>
          {background === "transparent" ? (
            <Text className="px-1 text-center text-xs text-ink-muted">{t.shrTransparentHint}</Text>
          ) : null}

          <Button icon="share-outline" label={t.shrCard} loading={busy} onPress={share} />
        </View>
      </View>
    </Modal>
  );
}
