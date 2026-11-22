import { useEffect, useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { View } from "react-native";
import { TokenService } from "@/services/token.service";
import ActiveSessionBanner from "@/components/workout/session/ActiveSessionBanner";
import ScreenBackground from "@/components/ui/ScreenBackground";
import FloatingTabBar from "@/components/ui/FloatingTabBar";
import {
  resumeSession,
  useActiveSession,
} from "@/hooks/useActiveSession";

export default function Layout() {
  const router = useRouter();
  const session = useActiveSession();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    TokenService.get().then((token) => {
      if (token) setAuthChecked(true);
      else router.replace("/(auth)/LoginScreen");
    });
  }, [router]);

  if (!authChecked) return <View className="flex-1 bg-background" />;

  return (
    <View className="flex-1 bg-background">
      <ScreenBackground glow />
      <Tabs
        tabBar={(props) => (
          <FloatingTabBar {...props} sessionActive={session != null} />
        )}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
      >
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="workouts" />
        <Tabs.Screen
          name="workout-trigger"
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
              if (session) resumeSession(session);
              else router.push("/(workout)/current");
            },
          })}
        />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <ActiveSessionBanner session={session} />
    </View>
  );
}
