import { Stack } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";

export default function StatsStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="records"
        options={{ contentStyle: { backgroundColor: WorkoutTheme.background } }}
      />
      <Stack.Screen
        name="workout-detail"
        options={{ contentStyle: { backgroundColor: WorkoutTheme.background } }}
      />
    </Stack>
  );
}
