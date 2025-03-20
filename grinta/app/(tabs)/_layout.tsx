import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Login", headerShown: false }} />
      <Stack.Screen name="register" options={{ title: "Register", headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: "Profile", headerShown: false }} />
      <Stack.Screen name="stats" options={{ title: "Stats", headerShown: false }} />
      <Stack.Screen name="explore" options={{ title: "Explore", headerShown: false }} />
      <Stack.Screen name="workouts" options={{ title: "Workouts", headerShown: false }} />
    </Stack>
  );
}
