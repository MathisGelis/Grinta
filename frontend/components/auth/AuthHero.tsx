import React from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";

type Tab = "login" | "register";

type Props = {
  image: ImageSource | number;
  active: Tab;
  title: React.ReactNode;
  subtitle?: string;
};

/** En-tête commun de connexion / inscription : photo, menu à gélules en verre, titre. */
export default function AuthHero({ image, active, title, subtitle }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const heroHeight = Math.max(250, height * 0.34) + insets.top;

  return (
    <View>
      <View className="overflow-hidden rounded-b-hero" style={{ height: heroHeight, borderCurve: "continuous" }}>
        <Image source={image} className="absolute h-full w-full" contentFit="cover" cachePolicy="memory-disk" />
        <LinearGradient
          colors={["transparent", WorkoutTheme.background]}
          className="absolute inset-x-0 bottom-0 h-[75%]"
        />

        <View className="px-5" style={{ paddingTop: insets.top + 12 }}>
          <SegmentedControl<Tab>
            variant="glass"
            id="auth-tabs"
            value={active}
            onChange={(tab) =>
              router.replace(tab === "login" ? "/(auth)/LoginScreen" : "/(auth)/onboarding/GenderScreen")
            }
            options={[
              { value: "login", label: t.login },
              { value: "register", label: t.signUp },
            ]}
          />
        </View>

        <View className="absolute inset-x-0 bottom-4 px-6">
          <Text className="text-[30px] font-semibold text-ink">{title}</Text>
          {subtitle ? (
            <Text className="mt-1.5 text-sm leading-5 text-ink-muted">{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
