import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import Modal from "@/components/ui/AppModal";
import IconButton from "@/components/ui/IconButton";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import { useTranslation } from "@/contexts/LanguageContext";

export type ExerciseFilters = {
  equipment: string | null;
  muscle: string | null;
  type: string | null;
};

export const NO_FILTERS: ExerciseFilters = {
  equipment: null,
  muscle: null,
  type: null,
};

type Props = {
  visible: boolean;
  value: ExerciseFilters;
  onClose: () => void;
  onApply: (filters: ExerciseFilters) => void;
};

type Group = {
  field: keyof ExerciseFilters;
  title: string;
  options: Record<string, string>;
};

function ExerciseFilterSheet({ visible, value, onClose, onApply }: Props) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [draft, setDraft] = useState<ExerciseFilters>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const groups: Group[] = [
    { field: "equipment", title: t.equipment, options: t.equipmentNames },
    { field: "muscle", title: t.primaryMuscle, options: t.muscleNames },
    { field: "type", title: t.exerciseType, options: t.exerciseTypeNames },
  ];

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      animationIn="slideInUp"
      style={{ justifyContent: "flex-end", margin: 0 }}
    >
      <View className="rounded-t-hero bg-surface px-5 pb-8 pt-3">
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-raised" />
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-2xl font-semibold text-ink">
            {t.filterExercises}
          </Text>
          <IconButton icon="close" label={t.closeLabel} onPress={onClose} />
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          style={{ maxHeight: windowHeight * 0.7 }}
        >
          {groups.map((group) => (
            <View key={group.field}>
              <Text className="mb-3 text-base font-semibold text-ink">
                {group.title}
              </Text>
              <View className="mb-6 flex-row flex-wrap gap-2">
                {Object.entries(group.options).map(([key, label]) => (
                  <Chip
                    key={key}
                    label={label}
                    active={draft[group.field] === key}
                    onPress={() =>
                      setDraft((prev) => ({
                        ...prev,
                        [group.field]: prev[group.field] === key ? null : key,
                      }))
                    }
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
        <View className="mt-4 flex-row gap-3">
          <Button
            className="flex-1"
            variant="secondary"
            label={t.reset}
            onPress={() => onApply(NO_FILTERS)}
          />
          <Button
            className="flex-1"
            label={t.apply}
            onPress={() => onApply(draft)}
          />
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(ExerciseFilterSheet);
