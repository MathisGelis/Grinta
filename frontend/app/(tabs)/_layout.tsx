import { Tabs, useRouter } from "expo-router";
import { View } from "react-native";
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

  return (
    <View className="flex-1 bg-background">
      <ScreenBackground />
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
        <Tabs.Screen name="social" options={{ href: null }} />
        <Tabs.Screen name="profile" />
      </Tabs>
      <ActiveSessionBanner session={session} />
    </View>
  );
}
