import React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { mediaUrl } from "@/services/api";

type AvatarProps = {
  /** Miniature en liste, avatar complet sur le profil ; null sans photo. */
  uri?: string | null;
  name?: string;
  size?: number;
  className?: string;
};

export const initialsOf = (name?: string, max = 1): string =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, max) || "?";

/** Cercle avec la photo si elle existe, sinon les initiales. Cache disque : les URL sont immuables. */
export default function Avatar({ uri, name, size = 40, className = "" }: AvatarProps) {
  const source = mediaUrl(uri);
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      className={`items-center justify-center overflow-hidden bg-accent-tint ${className}`}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          cachePolicy="disk"
          contentFit="cover"
          transition={150}
          style={{ width: size, height: size }}
        />
      ) : (
        <Text
          className="font-semibold text-ink"
          style={{ fontSize: Math.max(12, Math.round(size * 0.36)) }}
        >
          {initialsOf(name, size >= 80 ? 2 : 1)}
        </Text>
      )}
    </View>
  );
}
