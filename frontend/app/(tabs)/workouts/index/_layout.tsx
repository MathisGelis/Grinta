import { Tabs } from "expo-router";
import { WorkoutsNavBar } from "@/components/workoutCreation/WorkoutsNavBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <WorkoutsNavBar />,
        tabBarStyle: { display: "none" },
        headerShown: true,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarLabel: "Séances" }} />
      <Tabs.Screen name="programms" options={{ tabBarLabel: "Programmes" }} />
      <Tabs.Screen name="exercises" options={{ tabBarLabel: "Exercices" }} />
    </Tabs>
  );
}
