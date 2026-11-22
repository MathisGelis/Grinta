import React from "react";
import { ScrollView, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import PressableScale from "@/components/ui/PressableScale";

type Props = {
  title: string;
  onBack: () => void;
  onReset?: () => void;
  onApply?: () => void;
  children: React.ReactNode;
};

/** Page de filtres affichée à la place du contenu d'un slider : retour, options, puis Réinitialiser / Appliquer. */
export default function SheetFilterPage({ title, onBack, onReset, onApply, children }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-3 px-5 pb-5">
        <PressableScale
          onPress={onBack}
          halo={false}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t.closeLabel}
        >
          <Ionicons name="chevron-back" size={26} color={WorkoutTheme.text.primary} />
        </PressableScale>
        <Text className="flex-1 text-xl font-semibold text-ink">{title}</Text>
      </View>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
      >
        {children}
      </ScrollView>
      {onReset && onApply ? (
        <View
          className="flex-row gap-3 px-5 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button className="flex-1" variant="secondary" label={t.reset} onPress={onReset} />
          <Button className="flex-1" label={t.apply} onPress={onApply} />
        </View>
      ) : null}
    </View>
  );
}
