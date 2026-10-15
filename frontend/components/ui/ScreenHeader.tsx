import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IconButton from "./IconButton";
import { useTranslation } from "@/contexts/LanguageContext";

type Props = {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
  className?: string;
};

export default function ScreenHeader({
  title,
  right,
  onBack,
  className = "",
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View
      className={`flex-row items-center justify-between px-5 pb-5 ${className}`}
      style={{ paddingTop: insets.top + 12 }}
    >
      <IconButton
        icon="chevron-back"
        label={t.back}
        onPress={onBack ?? (() => router.back())}
      />
      <Text
        className="mx-3 flex-1 text-center text-lg font-semibold text-ink"
        numberOfLines={1}
      >
        {title}
      </Text>
      {right ?? <View className="w-11" />}
    </View>
  );
}
