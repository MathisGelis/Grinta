import "../global.css";
import "@/components/ui/interop";
import { ThemeProvider, DarkTheme } from "expo-router/react-navigation";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { LanguageProvider } from "@/contexts/LanguageContext";

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: WorkoutTheme.accent.purple,
    background: WorkoutTheme.background,
    card: WorkoutTheme.backgroundSecondary,
    text: WorkoutTheme.text.primary,
    border: WorkoutTheme.border,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: WorkoutTheme.background }}
    >
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <LanguageProvider>
          <ThemeProvider value={AppTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "none",
                contentStyle: { backgroundColor: WorkoutTheme.background },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
