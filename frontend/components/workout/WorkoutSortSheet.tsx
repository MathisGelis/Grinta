import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "@/components/ui/AppModal";
import PressableScale from "@/components/ui/PressableScale";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";

export type WorkoutSort = "default" | "name" | "exercises";

type Props = {
  visible: boolean;
  value: WorkoutSort;
  onClose: () => void;
  onSelect: (sort: WorkoutSort) => void;
};

function WorkoutSortSheet({ visible, value, onClose, onSelect }: Props) {
  const { t } = useTranslation();
  const options: { value: WorkoutSort; label: string }[] = [
    { value: "default", label: t.sortDefault },
    { value: "name", label: t.sortName },
    { value: "exercises", label: t.sortExerciseCount },
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
      <View className="gap-3 rounded-t-hero bg-surface px-5 pb-10 pt-3">
        <View className="mb-2 h-1.5 w-12 self-center rounded-full bg-raised" />
        <Text className="mb-2 text-2xl font-semibold text-ink">{t.sortBy}</Text>
        {options.map((o) => (
          <PressableScale
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === o.value }}
            onPress={() => onSelect(o.value)}
            className={`h-12 flex-row items-center justify-between rounded-full px-5 ${value === o.value ? "bg-accent" : "bg-raised"}`}
          >
            <Text className="text-base font-medium text-ink">{o.label}</Text>
            {value === o.value && (
              <Ionicons name="checkmark" size={20} color={WorkoutTheme.text.primary} />
            )}
          </PressableScale>
        ))}
      </View>
    </Modal>
  );
}

export default React.memo(WorkoutSortSheet);
