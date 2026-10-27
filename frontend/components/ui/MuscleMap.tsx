import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import Body, { type ExtendedBodyPart } from "react-native-body-highlighter";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  BodySide,
  MuscleValue,
  SlugGroup,
  groupMusclesBySlug,
  intensityLevel,
  preferredSide,
} from "@/utils/muscles";
import SegmentedControl from "@/components/ui/SegmentedControl";

const LEVEL_OPACITIES = [0.3, 0.5, 0.75, 1];
const LEVEL_COLORS = LEVEL_OPACITIES.map((opacity) =>
  withAlpha(WorkoutTheme.accent.purple, opacity),
);

type Props = {
  data: MuscleValue[];
  unit?: string;
  legend?: { color: string; label: string }[];
  gender?: "male" | "female";
  scale?: number;
  className?: string;
};

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function MuscleMap({
  data,
  unit,
  legend,
  gender = "male",
  scale = 0.85,
  className = "",
}: Props) {
  const { t } = useTranslation();
  const grouped = useMemo(() => groupMusclesBySlug(data), [data]);
  const defaultSide = useMemo(() => preferredSide(grouped.groups), [grouped]);
  const [pickedSide, setPickedSide] = useState<BodySide | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const side = pickedSide ?? defaultSide;

  const max = useMemo(
    () => Math.max(0, ...grouped.groups.map((group) => group.value)),
    [grouped],
  );

  const bodyData = useMemo<ExtendedBodyPart[]>(
    () =>
      grouped.groups.map((group) =>
        group.color
          ? { slug: group.slug, color: group.color }
          : {
              slug: group.slug,
              intensity: intensityLevel(group.value, max, LEVEL_COLORS.length),
            },
      ),
    [grouped, max],
  );

  const muscleName = (key: string) => t.muscleNames[key] ?? key.replace(/_/g, " ");
  const withUnit = (value: number) =>
    `${formatValue(value)}${unit ? ` ${unit}` : ""}`;

  const describeGroup = (group: SlugGroup) =>
    group.items.some((item) => item.label)
      ? group.items
          .map((item) =>
            item.label
              ? `${muscleName(item.muscle)} : ${item.label}`
              : muscleName(item.muscle),
          )
          .join("\n")
      : `${group.muscles.map(muscleName).join(" · ")} — ${withUnit(group.value)}`;

  const selectedGroup = grouped.groups.find((group) => group.slug === selected);

  return (
    <View className={`gap-4 ${className}`}>
      <SegmentedControl<BodySide>
        id="muscle-map-side"
        value={side}
        onChange={setPickedSide}
        options={[
          { value: "front", label: t.bodyFrontLabel },
          { value: "back", label: t.bodyBackLabel },
        ]}
      />

      <View className="items-center">
        <Body
          data={bodyData}
          colors={LEVEL_COLORS}
          side={side}
          gender={gender}
          scale={scale}
          border="none"
          defaultFill={WorkoutTheme.backgroundTertiary}
          hiddenParts={["hair"]}
          onBodyPartPress={(part) => setSelected(part.slug ?? null)}
        />
      </View>

      <View className="min-h-[44px] items-center justify-center rounded-full bg-raised px-5 py-2">
        <Text className="text-center text-sm text-ink" numberOfLines={2}>
          {selectedGroup ? describeGroup(selectedGroup) : "–"}
        </Text>
      </View>

      {legend ? (
        <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {legend.map((entry) => (
            <View key={entry.label} className="flex-row items-center gap-2">
              <View
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <Text className="text-xs text-ink-muted">{entry.label}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {LEVEL_COLORS.map((color, index) => (
            <View
              key={LEVEL_OPACITIES[index]}
              className="h-2.5 w-8 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </View>
      )}

      {grouped.unmapped.length > 0 ? (
        <View className="gap-2">
          <Text className="text-sm text-ink-muted">{t.otherMusclesLabel}</Text>
          <View className="flex-row flex-wrap gap-2">
            {grouped.unmapped.map((item) => (
              <View
                key={item.muscle}
                className="h-9 justify-center rounded-full bg-raised px-4"
              >
                <Text className="text-sm font-medium text-ink">
                  {muscleName(item.muscle)} ·{" "}
                  {item.label ?? withUnit(item.value)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
