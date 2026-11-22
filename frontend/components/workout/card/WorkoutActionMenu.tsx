import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Glass from "@/components/ui/Glass";
import PressableScale from "@/components/ui/PressableScale";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";

export type ActionMenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

type Props = {
  onClose: () => void;
  items: ActionMenuItem[];
};

/** Dropdown sous le bouton « ⋯ » de l'en-tête (même design que le partage d'un post). */
export default function WorkoutActionMenu({ onClose, items }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable
        accessibilityLabel={t.back}
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <Animated.View
        entering={FadeInUp.duration(180)}
        className="absolute right-5 z-30"
        style={{ top: insets.top + 12 + 44 + 8 }}
      >
        <Glass className="rounded-card">
          {items.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 ? <View className="mx-4 h-[1px] bg-line" /> : null}
              <PressableScale
                halo={false}
                className="flex-row items-center gap-3 px-4 py-4 pr-5"
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? WorkoutTheme.status.danger : WorkoutTheme.text.primary}
                />
                <Text
                  className={`text-[15px] font-semibold ${item.danger ? "text-danger" : "text-ink"}`}
                >
                  {item.label}
                </Text>
              </PressableScale>
            </React.Fragment>
          ))}
        </Glass>
      </Animated.View>
    </>
  );
}
