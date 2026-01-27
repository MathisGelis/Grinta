// app/index.tsx
import { Redirect } from "expo-router";
import { TokenService } from "@/services/token.service";

export default function Index() {
  const token = TokenService.get();

  if (!token) {
    return <Redirect href="/(auth)/LandingScreen" />;
  }

  return <Redirect href="/(tabs)/explore" />;
}
