import { Stack } from "expo-router";

export default function WorkoutsStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Mes Séances" }} />
    </Stack>
  );
}
