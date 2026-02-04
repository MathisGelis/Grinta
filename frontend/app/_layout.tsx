// app/_layout.tsx - VERSION SIMPLIFIÉE SANS FONTS
import "../global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme";

// ❌ PAS de SplashScreen.preventAutoHideAsync()
// ❌ PAS de useFonts

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Pas de condition "if (!loaded) return null" qui bloque le rendu

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: "#F8F8F8" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor="black" />
    </ThemeProvider>
  );
}