import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { WorkoutTheme } from "@/constants/Colors";
import SkipLink from "@/components/ui/SkipLink";
import OnboardingNav, { useNavLock } from "@/components/ui/OnboardingNav";
import ScreenBackground from "@/components/ui/ScreenBackground";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
import { useBlockHardwareBack } from "@/hooks/useBlockHardwareBack";
import { clearOnboardingDraft } from "@/utils/onboardingDraft";
const CIRCLE = 140;

export default function GenderScreen() {
  const { t } = useTranslation();
  // Première page du questionnaire: un retour sortirait de l'onboarding.
  useBlockHardwareBack();
  // Nouveau passage dans le questionnaire : on repart de zéro.
  useEffect(() => clearOnboardingDraft(), []);
  const once = useNavLock();
  const [selected, setSelected] = useState<"male" | "female" | null>(null);

  const choose = (gender: "male" | "female") => {
    if (gender !== selected) Haptics.selectionAsync();
    setSelected(gender);
  };

  const handleNext = () => {
    if (!selected) return;
    router.push({
      pathname: "/(auth)/onboarding/AgeScreen",
      params: { gender: selected },
    });
  };

  return (
    <View className="flex-1 pt-20 px-8">
      <ScreenBackground />
      <Text className="text-[28px] font-bold text-ink text-center mb-3">{t.tellAboutYourself}</Text>
      <Text className="text-[15px] text-ink-muted text-center leading-[22px] mb-[60px]">
        {t.genderIntro}
      </Text>

      <View className="items-center gap-6 flex-1 justify-center -mt-10">
        <PressableScale
          style={[styles.circle, selected === "male" && styles.circleActive]}
          onPress={() => choose("male")}
        >
          <MaterialCommunityIcons
            name="gender-male"
            size={56}
            color={selected === "male" ? WorkoutTheme.text.primary : WorkoutTheme.text.tertiary}
          />
          <Text
            className={`text-[15px] mt-1 ${selected === "male" ? "text-ink" : "text-ink-muted"}`}
          >
            {t.male}
          </Text>
        </PressableScale>

        <PressableScale
          style={[styles.circle, selected === "female" && styles.circleActive]}
          onPress={() => choose("female")}
        >
          <MaterialCommunityIcons
            name="gender-female"
            size={56}
            color={selected === "female" ? WorkoutTheme.text.primary : WorkoutTheme.text.tertiary}
          />
          <Text
            className={`text-[15px] mt-1 ${selected === "female" ? "text-ink" : "text-ink-muted"}`}
          >
            {t.female}
          </Text>
        </PressableScale>

        <SkipLink
          className="mt-4"
          textClassName="text-accent-light"
          label={t.preferNotToSay}
          onPress={() => once(() => router.push("/(auth)/onboarding/AgeScreen"))}
        />
      </View>

      <OnboardingNav
        hideBack
        onNext={handleNext}
        nextLabel={t.nextBtn}
        nextDisabled={!selected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: WorkoutTheme.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  circleActive: {
    backgroundColor: WorkoutTheme.accent.purple,
  },
});
