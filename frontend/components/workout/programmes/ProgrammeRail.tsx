import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { difficultyLabel } from "@/i18n/labels";
import { format } from "@/i18n/translations";
import type { SmallProgramm } from "@/services/programms.service";
import EmptyHint from "@/components/workout/EmptyHint";
import Card from "@/components/ui/Card";
import IconButton from "@/components/ui/IconButton";
import PressableScale from "@/components/ui/PressableScale";
import SectionHeader from "@/components/ui/SectionHeader";

type Props = {
  programmes: SmallProgramm[];
  onSearch?: () => void;
  /** Aucun programme à lister (le programme en cours n'est pas compté). */
  empty?: boolean;
  hasActive?: boolean;
};

function ProgrammeRail({ programmes, onSearch, empty, hasActive }: Props) {
  const { t } = useTranslation();

  return (
    <View>
      <SectionHeader
        title={t.programmes}
        className="mb-2"
        right={
          <>
            <IconButton
              icon="add"
              size={40}
              label={t.newProgramme}
              onPress={() => router.push("/(tabs)/workouts/create/programm" as any)}
            />
            {onSearch ? (
              <IconButton icon="search-outline" size={40} label={t.searchLabel} onPress={onSearch} />
            ) : null}
          </>
        }
      />
      {empty ? (
        <EmptyHint
          icon="calendar-outline"
          message={hasActive ? t.emptyOtherProgrammesHint : t.emptyProgrammesHint}
          actionLabel={t.createProgramme}
          onAction={() => router.push("/(tabs)/workouts/create/programm" as any)}
        />
      ) : null}
      {programmes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 12, paddingRight: 48 }}
        >
          {programmes.map((programme) => (
            <PressableScale
              key={programme.id}
              accessibilityRole="button"
              accessibilityLabel={programme.title}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/workouts/programme-detail",
                  params: { programmeId: programme.id },
                } as any)
              }
            >
              <Card size="tile" className="h-32 w-44 justify-between">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-accent-tint">
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={WorkoutTheme.accent.purple}
                  />
                </View>
                <View>
                  <Text numberOfLines={1} className="text-base font-semibold text-ink">
                    {programme.title}
                  </Text>
                  <Text numberOfLines={1} className="mt-0.5 text-xs text-ink-muted">
                    {format(t.daysCount, { n: programme.totalDays })},{" "}
                    {difficultyLabel(t, programme.difficulty).toLowerCase()}
                  </Text>
                </View>
              </Card>
            </PressableScale>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default React.memo(ProgrammeRail);
