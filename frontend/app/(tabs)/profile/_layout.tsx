import { Stack } from "expo-router";

export default function ProfileStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="settings-units" />
      <Stack.Screen name="settings-notifications" />
      <Stack.Screen name="settings-language" />
      <Stack.Screen name="settings-contact" />
    </Stack>
  );
}
