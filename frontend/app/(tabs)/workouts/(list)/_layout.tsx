import { View } from "react-native";
import { Tabs } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import { WorkoutsSearchProvider } from "@/contexts/WorkoutsSearchContext";

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <WorkoutsSearchProvider>
      <View className="flex-1">
        <Tabs
          screenOptions={{
            tabBarStyle: { display: "none" },
            sceneStyle: { backgroundColor: "transparent" },
            headerShown: false,
          }}
        >
          <Tabs.Screen name="index" options={{ tabBarLabel: t.creation }} />
          <Tabs.Screen name="exercises" options={{ tabBarLabel: t.exercises }} />
        </Tabs>
      </View>
    </WorkoutsSearchProvider>
  );
}
