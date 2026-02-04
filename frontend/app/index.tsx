// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // Pour l'instant, redirigeons TOUJOURS vers LandingScreen
  return <Redirect href="/(auth)/LandingScreen" />;
}