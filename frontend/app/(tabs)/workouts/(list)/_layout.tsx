import { Tabs } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import { WorkoutsNavBar } from "@/components/workout/WorkoutsNavBar";

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        header: () => <WorkoutsNavBar />,
        tabBarStyle: { display: "none" },
        sceneStyle: { backgroundColor: "transparent" },
        headerShown: true,
        headerStyle: { backgroundColor: "transparent" },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: t.sessions }} />
      <Tabs.Screen name="programms" options={{ tabBarLabel: t.programmes }} />
      <Tabs.Screen name="exercises" options={{ tabBarLabel: t.exercises }} />
    </Tabs>
  );
}
