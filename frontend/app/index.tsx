import { useEffect } from "react";
import { router } from "expo-router";
import { TokenService } from "@/services/token.service";

export default function Index() {
  useEffect(() => {
    TokenService.get().then((token) => {
      if (token) {
        router.replace("/(tabs)/explore");
      } else {
        router.replace("/(auth)/welcome/screens/SplashScreen");
      }
    });
  }, []);

  return null;
}
