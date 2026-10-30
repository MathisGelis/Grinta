import { Stack } from "expo-router";
import { WorkoutTheme } from "@/constants/Colors";

export default function ProfileStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: WorkoutTheme.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ contentStyle: { backgroundColor: "transparent" } }}
      />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="settings" />
      <Stack.Screen
        name="premium"
        options={{ animation: "slide_from_left", gestureEnabled: false }}
      />
      <Stack.Screen name="settings-units" />
      <Stack.Screen name="settings-notifications" />
      <Stack.Screen name="settings-language" />
      <Stack.Screen name="settings-contact" />
      <Stack.Screen name="followers" />
      <Stack.Screen name="user-profile" />
      <Stack.Screen name="userPost" />
    </Stack>
  );
}
