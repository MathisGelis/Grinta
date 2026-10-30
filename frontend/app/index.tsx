import { useEffect } from "react";
import { router } from "expo-router";
import { TokenService } from "@/services/token.service";
import { getItem } from "@/core/services/storage";

export default function Index() {
  useEffect(() => {
    Promise.all([TokenService.get(), getItem("hasSeenOnboarding")]).then(([token, seen]) => {
      if (token) {
        router.replace("/(tabs)/explore");
      } else if (seen) {
        router.replace("/(auth)/LoginScreen");
      } else {
        router.replace("/(auth)/welcome/screens/SplashScreen");
      }
    });
  }, []);

  return null;
}
