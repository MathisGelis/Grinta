import React from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IconButton from "./IconButton";
import TopBlur from "./TopBlur";
import { useTranslation } from "@/contexts/LanguageContext";

type Props = {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
  className?: string;
  /** Barre flottante : fond transparent avec un flou doux qui s'estompe sous la barre. Le contenu défile dessous. */
  floating?: boolean;
};

/** Hauteur d'un `ScreenHeader` flottant : à utiliser comme `paddingTop` du contenu qui défile dessous. */
export function useFloatingHeaderHeight(): number {
  return useSafeAreaInsets().top + 12 + 44 + 12;
}

export default function ScreenHeader({
  title,
  right,
  onBack,
  className = "",
  floating = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  return (
    <View
      className={`flex-row items-center justify-between px-5 ${
        floating ? "absolute inset-x-0 top-0 z-10 pb-3" : "pb-5"
      } ${className}`}
      style={{ paddingTop: insets.top + 12 }}
    >
      {floating ? <TopBlur height={insets.top + 12 + 44 + 12} /> : null}
      <IconButton
        icon="chevron-back"
        label={t.back}
        variant={floating ? "glass" : "surface"}
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
