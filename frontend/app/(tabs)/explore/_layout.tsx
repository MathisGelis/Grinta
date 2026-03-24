import { Stack } from "expo-router";

export default function ExploreStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="workout-detail" />
    </Stack>
  );
}
