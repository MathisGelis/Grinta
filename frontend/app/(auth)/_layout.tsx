import { Stack } from "expo-router";

export default function AuthNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LandingScreen" />
      <Stack.Screen name="RegisterScreen" />
      <Stack.Screen name="LoginScreen" />
    </Stack>
  );
}