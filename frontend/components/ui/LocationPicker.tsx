import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

type Option = { key: string; label: string };

type LocationPickerProps = {
  label: string;
  required?: boolean;
  options: Option[];
  value: string;
  onChange: (key: string) => void;
};

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  GYM: "barbell-outline",
  HOME: "home-outline",
  OUTDOORS: "leaf-outline",
  ANY: "infinite-outline",
};

/** Carrousel de lieux: glisser (ou chevrons) pour changer, points d'avancement en dessous. */
export default function LocationPicker({
  label,
  required,
  options,
  value,
  onChange,
}: LocationPickerProps) {
  const accent = WorkoutTheme.accent.purple;
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [widths, setWidths] = useState<Record<string, number>>({});
  // Largeur du carrousel = celle du plus large contenu (icône ou texte)
  const width = Math.ceil(
    options.reduce((max, o) => Math.max(max, widths[o.key] ?? 0), 0),
  );
  const index = Math.max(0, options.findIndex((o) => o.key === value));

  useEffect(() => {
    if (width > 0) scrollRef.current?.scrollTo({ x: index * width, animated: true });
  }, [index, width]);

  const go = (next: number) => {
    if (next >= 0 && next < options.length) onChange(options[next].key);
  };

  const Chevron = ({ icon, delta }: { icon: "chevron-back" | "chevron-forward"; delta: number }) => {
    const next = index + delta;
    const disabled = next < 0 || next >= options.length;
    return (
      <Pressable
        onPress={() => go(next)}
        hitSlop={10}
        accessibilityRole="button"
        style={{ opacity: disabled ? 0.35 : 1 }}
      >
        <Ionicons name={icon} size={22} color={accent} />
      </Pressable>
    );
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 16 }}>
        <Text className="text-sm text-ink-muted">
          {label}
          {required ? <Text className="text-danger"> *</Text> : null}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Chevron icon="chevron-back" delta={-1} />
          <Chevron icon="chevron-forward" delta={1} />
        </View>
      </View>

      <View style={{ marginTop: 16, alignItems: "center" }}>
        {/* Mesure invisible de chaque option */}
        <View pointerEvents="none" style={{ position: "absolute", opacity: 0, alignItems: "flex-start" }}>
          {options.map((option) => (
            <View
              key={option.key}
              style={{ alignItems: "center" }}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                setWidths((prev) => (prev[option.key] === w ? prev : { ...prev, [option.key]: w }));
              }}
            >
              <Ionicons name="barbell-outline" size={28} />
              <Text className="text-base text-ink" style={{ marginTop: 14 }}>
                {option.label}
              </Text>
            </View>
          ))}
        </View>

        {width > 0 && (
          <View style={{ width }}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: index * width, y: 0 }}
              onMomentumScrollEnd={(e) => go(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {options.map((option) => (
                <View key={option.key} style={{ width, alignItems: "center" }}>
                  <Ionicons name={ICONS[option.key] ?? "location-outline"} size={28} color={accent} />
                  <Text numberOfLines={1} className="text-base text-ink" style={{ marginTop: 14 }}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}
