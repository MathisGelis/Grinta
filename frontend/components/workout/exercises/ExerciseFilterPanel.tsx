import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { WorkoutTheme, withAlpha } from "@/constants/Colors";
import Glass from "@/components/ui/Glass";
import PressableScale from "@/components/ui/PressableScale";
import SheetFilterPage from "@/components/workout/SheetFilterPage";
import { useTranslation } from "@/contexts/LanguageContext";

export type ExerciseFilters = {
  equipment: string[];
  muscle: string[];
  type: string[];
};

export const NO_FILTERS: ExerciseFilters = {
  equipment: [],
  muscle: [],
  type: [],
};

type Props = {
  value: ExerciseFilters;
  onBack: () => void;
  onApply: (filters: ExerciseFilters) => void;
};

/** Filtres d'exercices : un champ déroulant par critère, les choix retenus s'affichent en pastilles dans le champ. */
export default function ExerciseFilterPanel({ value, onBack, onApply }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<ExerciseFilters>(value);
  const [openField, setOpenField] = useState<keyof ExerciseFilters | null>(null);

  const groups: { field: keyof ExerciseFilters; title: string; options: Record<string, string> }[] = [
    { field: "muscle", title: t.primaryMuscle, options: t.muscleNames },
    { field: "equipment", title: t.equipment, options: t.equipmentNames },
    { field: "type", title: t.exerciseType, options: t.exerciseTypeNames },
  ];

  const toggle = (field: keyof ExerciseFilters, key: string) =>
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field].includes(key)
        ? prev[field].filter((k) => k !== key)
        : [...prev[field], key],
    }));

  return (
    <SheetFilterPage
      title={t.filterExercises}
      onBack={onBack}
      onReset={() => onApply(NO_FILTERS)}
      onApply={() => onApply(draft)}
    >
      {groups.map((group) => {
        const selected = draft[group.field];
        const isOpen = openField === group.field;
        return (
          <View
            key={group.field}
            className="mb-6"
            style={{ zIndex: isOpen ? 10 : 1, elevation: isOpen ? 10 : 0 }}
          >
            <View>
              <PressableScale
                onPress={() => setOpenField(isOpen ? null : group.field)}
                halo={false}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
              >
                <Glass className="rounded-tile px-4 py-3" style={{ minHeight: 48 }}>
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-base font-medium text-ink">{group.title}</Text>
                    <View className="flex-row items-center gap-2">
                      {selected.length === 0 ? (
                        <Text className="text-base" style={{ color: WorkoutTheme.overlay.glassText }}>
                          {t.all}
                        </Text>
                      ) : null}
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={WorkoutTheme.overlay.glassText}
                      />
                    </View>
                  </View>
                  {selected.length > 0 ? (
                    <View className="mt-3 flex-row flex-wrap gap-1.5">
                      {selected.map((key) => (
                        <Pressable
                          key={key}
                          onPress={() => toggle(group.field, key)}
                          hitSlop={6}
                          className="h-8 flex-row items-center gap-1.5 rounded-full bg-accent pl-3 pr-2"
                          accessibilityRole="button"
                        >
                          <Text className="text-sm font-medium text-ink">
                            {group.options[key] ?? key}
                          </Text>
                          <Ionicons name="close" size={14} color={WorkoutTheme.text.primary} />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </Glass>
              </PressableScale>
              {isOpen ? (
                <Glass
                  className="rounded-tile"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: 8,
                    maxHeight: 260,
                    zIndex: 20,
                    elevation: 20,
                  }}
                >
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {Object.entries(group.options).map(([key, label], index) => {
                      const isSelected = selected.includes(key);
                      return (
                        <Pressable
                          key={key}
                          onPress={() => toggle(group.field, key)}
                          className="flex-row items-center justify-between px-4 py-3"
                          style={{
                            backgroundColor: isSelected
                              ? withAlpha(WorkoutTheme.accent.purple, 0.22)
                              : undefined,
                            borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                            borderTopColor: WorkoutTheme.overlay.glassBorder,
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            className={`text-base text-ink ${isSelected ? "font-semibold" : ""}`}
                          >
                            {label}
                          </Text>
                          {isSelected ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={WorkoutTheme.accent.purple}
                            />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Glass>
              ) : null}
            </View>
          </View>
        );
      })}
      {openField ? <View style={{ height: 280 }} /> : null}
    </SheetFilterPage>
  );
}
