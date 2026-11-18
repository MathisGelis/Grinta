import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { router, type Href } from "expo-router";
import { TokenService } from "@/services/token.service";
import { getItem } from "@/core/services/storage";
import ScreenBackground from "@/components/ui/ScreenBackground";
import LogoIntro from "@/components/ui/LogoIntro";
import { UserService } from "@/services/user.service";

// Vrai une fois l'animation jouée : elle n'a lieu qu'au lancement de l'app, pas à chaque retour sur cette route.
let introPlayed = false;

export default function Index() {
  const [target, setTarget] = useState<Href | null>(null);
  const [introDone, setIntroDone] = useState(introPlayed);
  // La destination se calcule pendant l'animation du logo.
  useEffect(() => {
    Promise.all([TokenService.get(), getItem("hasSeenOnboarding")]).then(([token, seen]) => {
      if (token) {
        // Pendant l'intro : l'identité est demandée une fois, les écrans la trouvent en cache.
        void UserService.getMyId().catch(() => {});
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

  const handleFinish = useCallback(() => {
    introPlayed = true;
    setIntroDone(true);
  }, []);

  return (
    <View className="flex-1">
      <ScreenBackground />
      {introDone ? null : <LogoIntro onFinish={handleFinish} />}
    </View>
  );
}
