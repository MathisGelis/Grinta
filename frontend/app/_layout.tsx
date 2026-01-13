import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: "#F8F8F8" },
        }}
      >
        {/* Main app with persistent bottom tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Screens outside tabs */}
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor="black" />
    </ThemeProvider>
  );
}
