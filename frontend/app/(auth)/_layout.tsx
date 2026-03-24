import { Stack } from "expo-router";

export default function AuthNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome/screens/SplashScreen" />
      <Stack.Screen name="welcome/screens/OnboardingScreen" />
      <Stack.Screen name="LandingScreen" />
      <Stack.Screen name="LoginScreen" />
      <Stack.Screen name="RegisterScreen" />
      <Stack.Screen name="onboarding/GenderScreen" />
      <Stack.Screen name="onboarding/AgeScreen" />
      <Stack.Screen name="onboarding/WeightScreen" />
      <Stack.Screen name="onboarding/HeightScreen" />
      <Stack.Screen name="onboarding/GoalScreen" />
    </Stack>
  );
}