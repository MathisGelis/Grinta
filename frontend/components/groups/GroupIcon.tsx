import React from "react";
import { Text, View } from "react-native";
import { initialsOf } from "@/components/ui/Avatar";

type Props = {
  name: string;
  size?: number;
  /** Anneau d'accent, comme l'avatar du profil. */
  ring?: boolean;
};

/** Pastille d'un groupe : première lettre du nom au centre d'un cercle. */
export default function GroupIcon({ name, size = 44, ring = false }: Props) {
  const circle = (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      className="items-center justify-center bg-accent-tint"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text
        className="font-semibold text-ink"
        style={{ fontSize: Math.max(14, Math.round(size * 0.4)) }}
      >
        {initialsOf(name, 1)}
      </Text>
    </View>
  );
  return ring ? <View className="rounded-full bg-accent p-[3px]">{circle}</View> : circle;
}
