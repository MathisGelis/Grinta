import { Animated, View } from "react-native";
import { Tabs, router, usePathname } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  WorkoutsSearchProvider,
  WorkoutsSection,
  useWorkoutsSearchBar,
} from "@/contexts/WorkoutsSearchContext";
import { WorkoutsNavBar } from "@/components/workout/WorkoutsNavBar";
import GlassSearchBar from "@/components/GlassSearchBar";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

const ADD_ROUTES = {
  sessions: "/(tabs)/workouts/create/workout",
  programmes: "/(tabs)/workouts/create/programm",
  exercises: "/(tabs)/workouts/create/exercise",
} as const;

function SharedSearchBar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { queries, setQuery, openFilter } = useWorkoutsSearchBar();
  const { keyboardY, bottomOffset } = useKeyboardOffset();

  const section: WorkoutsSection = pathname.includes("exercises")
    ? "exercises"
    : pathname.includes("programms")
      ? "programmes"
      : "sessions";

  const placeholder = {
    sessions: t.searchWorkout,
    programmes: t.searchProgrammePlaceholder,
    exercises: t.searchExercise,
  }[section];

  return (
    <Animated.View
      className="absolute left-0 right-0 px-5"
      style={{
        bottom: bottomOffset + 12,
        transform: [{ translateY: keyboardY }],
      }}
    >
      <GlassSearchBar
        value={queries[section]}
        onChangeText={(query) => setQuery(section, query)}
        onAdd={() => router.push(ADD_ROUTES[section] as any)}
        placeholder={placeholder}
        onFilter={section === "programmes" ? undefined : () => openFilter(section)}
      />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <WorkoutsSearchProvider>
      <View className="flex-1">
        <WorkoutsNavBar />
        <Tabs
          screenOptions={{
            tabBarStyle: { display: "none" },
            sceneStyle: { backgroundColor: "transparent" },
            headerShown: false,
          }}
        >
          <Tabs.Screen name="index" options={{ tabBarLabel: t.sessions }} />
          <Tabs.Screen name="programms" options={{ tabBarLabel: t.programmes }} />
          <Tabs.Screen name="exercises" options={{ tabBarLabel: t.exercises }} />
        </Tabs>
        <SharedSearchBar />
      </View>
    </WorkoutsSearchProvider>
  );
}
