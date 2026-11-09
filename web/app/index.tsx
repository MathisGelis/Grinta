import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import { TokenService } from "@/services/token.service";
import { getItem } from "@/core/services/storage";
import ScreenBackground from "@/components/ui/ScreenBackground";
import LogoIntro from "@/components/ui/LogoIntro";

export default function Index() {
  const [target, setTarget] = useState<Href | null>(null);
  const [introDone, setIntroDone] = useState(false);

  // La destination se calcule pendant l'animation du logo.
  useEffect(() => {
    Promise.all([TokenService.get(), getItem("hasSeenOnboarding")]).then(([token, seen]) => {
      if (token) {
        setTarget("/(tabs)/explore");
      } else if (seen) {
        setTarget("/(auth)/LoginScreen");
      } else {
        setTarget("/(auth)/welcome/screens/OnboardingScreen");
      }
    });
  }, []);

  // On ne redirige qu'une fois l'animation terminée ET la destination connue.
  useEffect(() => {
    if (introDone && target) router.replace(target);
  }, [introDone, target]);

  const handleFinish = useCallback(() => setIntroDone(true), []);

  return (
    <View className="flex-1">
      <ScreenBackground />
      <LogoIntro onFinish={handleFinish} />
    </View>
  );
}
