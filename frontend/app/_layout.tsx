import "../global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Without this, React Navigation falls back to zero insets for the
          first frame on a cold start, so headers using SafeAreaView flash
          up under the notch before dropping into place. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <LanguageProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
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
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
