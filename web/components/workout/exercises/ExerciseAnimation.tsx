import React, { useEffect, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { mediaUrl } from "@/services/api";

const FRAME_MS = 700;

type Props = {
  /** `[photo de départ, photo d'arrivée]` ou `[]`. */
  imageUrls?: string[] | null;
  /** Repli : `image_url` de la liste. */
  fallbackUrl?: string | null;
  label?: string;
};

/** Affiche les deux photos en alternance pour animer le mouvement, à la manière d'un GIF. */
export default function ExerciseAnimation({ imageUrls, fallbackUrl, label }: Props) {
  const frames = (imageUrls?.length ? imageUrls : fallbackUrl ? [fallbackUrl] : [])
    .map(mediaUrl)
    .filter((u): u is string => !!u);
  const [frame, setFrame] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const animated = frames.length > 1 && !reduceMotion;
  useEffect(() => {
    if (!animated) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % frames.length), FRAME_MS);
    return () => clearInterval(id);
  }, [animated, frames.length]);

  if (frames.length === 0) {
    return (
      <View className="h-48 items-center justify-center overflow-hidden rounded-tile bg-accent-tint">
        <Ionicons name="barbell" size={56} color={WorkoutTheme.accent.purple} />
      </View>
    );
  }

  // Les photos sont empilées et seule la courante est visible : pas de rechargement entre deux images.
  return (
    <View
      className="h-56 overflow-hidden rounded-tile bg-accent-tint"
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      {frames.map((uri, i) => (
        <Image
          key={uri}
          source={{ uri }}
          cachePolicy="disk"
          contentFit="cover"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: i === frame ? 1 : 0,
          }}
        />
      ))}
    </View>
  );
}
