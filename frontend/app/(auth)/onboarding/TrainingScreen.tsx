import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import ScreenBackground from "@/components/ui/ScreenBackground";
import OnboardingNav from "@/components/ui/OnboardingNav";
import Chip from "@/components/ui/Chip";
import type { Level, TrainingLocation } from "@/services/user.service";
import { mergeOnboardingDraft } from "@/utils/onboardingDraft";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";

const LEVELS: { id: Level; label: "levelBeginner" | "levelIntermediate" | "levelAdvanced" }[] = [
  { id: "beginner", label: "levelBeginner" },
  { id: "intermediate", label: "levelIntermediate" },
  { id: "advanced", label: "levelAdvanced" },
];
const LOCATIONS: { id: TrainingLocation; label: "locGym" | "locHome" }[] = [
  { id: "gym", label: "locGym" },
  { id: "home", label: "locHome" },
];

export default function TrainingScreen() {
  const { t } = useTranslation();
  const [level, setLevel] = useState<Level>("beginner");
  const [days, setDays] = useState(3);
  const [location, setLocation] = useState<TrainingLocation>("gym");

  // Dernière question : on crée le compte, le profil sera enregistré juste après.
  const next = () => router.push("/(auth)/RegisterScreen" as any);

  const save = () => {
    mergeOnboardingDraft({ level, trainingDaysPerWeek: days, trainingLocation: location });
    next();
  };

  return (
    <View className="flex-1 px-8 pt-20">
      <ScreenBackground />
      <Text className="mb-3 text-[28px] font-bold text-ink">{t.obTrainingTitle}</Text>
      <Text className="mb-8 text-[15px] text-ink-muted">{t.obTrainingIntro}</Text>

      <View className="flex-1 gap-8">
        <View className="gap-3">
          <Text className="text-sm text-ink-muted">{t.obLevel}</Text>
          <View className="flex-row flex-wrap gap-2">
            {LEVELS.map((l) => (
              <Chip key={l.id} label={t[l.label]} active={level === l.id} onPress={() => setLevel(l.id)} />
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-sm text-ink-muted">{t.obDays}</Text>
          <View className="flex-row flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Chip
                key={n}
                label={String(n)}
                active={days === n}
                onPress={() => setDays(n)}
                className="w-12 px-0"
              />
            ))}
          </View>
          <Text className="text-xs text-ink-muted">{format(t.obDaysValue, { n: days })}</Text>
        </View>

        <View className="gap-3">
          <Text className="text-sm text-ink-muted">{t.obLocation}</Text>
          <View className="flex-row gap-2">
            {LOCATIONS.map((l) => (
              <Chip key={l.id} label={t[l.label]} active={location === l.id} onPress={() => setLocation(l.id)} />
            ))}
          </View>
        </View>
      </View>

      <OnboardingNav
        onNext={save}
        nextLabel={t.obContinue}
        onSkip={next}
        skipLabel={t.skipBtn}
      />
    </View>
  );
}
