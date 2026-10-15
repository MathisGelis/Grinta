import { Stack } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";

export default function WorkoutsStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="(list)" />
      <Stack.Screen
        name="create/workout"
        options={{ contentStyle: { backgroundColor: WorkoutTheme.background } }}
      />
      <Stack.Screen
        name="create/exercise"
        options={{ contentStyle: { backgroundColor: WorkoutTheme.background } }}
      />
      <Stack.Screen
        name="create/programm"
        options={{ contentStyle: { backgroundColor: WorkoutTheme.background } }}
      />
    </Stack>
  );
}
