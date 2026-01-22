import { getItem } from "@/core/services/storage";
import LoginScreen from "@/features/auth/screens/LoginScreen";
import RegisterScreen from "@/features/auth/screens/RegisterScreen";
import LandingScreen from "@/features/landing/screens/LandingScreen";
import OnboardingScreen from "@/features/welcome/screens/OnboardingScreen";
import SplashScreen from "@/features/welcome/screens/SplashScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Landing: undefined;
  Register: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const token = await TokenService.get();

  //     if (token) {
  //       navigate("/explore");
  //     }
  //   };

  //   checkAuth();
  // }, []);

  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>("Splash");

  useEffect(() => {
    const checkWelcome = async () => {
      const hasSeenWelcome = await getItem("hasSeenWelcome");
      if (hasSeenWelcome === "true") {
        setInitialRoute("Landing");
      } else {
        setInitialRoute("Splash");
      }
    };
    checkWelcome();
  }, []);

  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
