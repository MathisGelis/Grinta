import { Stack } from "expo-router";

export default function ExploreStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Accueil" }} />
    </Stack>
  );
}
