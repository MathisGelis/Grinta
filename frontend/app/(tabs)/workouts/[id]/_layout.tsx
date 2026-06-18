import { Stack } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: WorkoutTheme.background,
        },
      }}
    />
  );
}
