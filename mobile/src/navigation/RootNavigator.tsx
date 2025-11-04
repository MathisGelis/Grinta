import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LandingScreen from "../mobile/src/features/landing/screens/LandingScreen";
import RegisterScreen from "../mobile/src/features/auth/screens/RegisterScreen";
import SplashScreen from "../mobile/src/features/welcome/screens/SplashScreen";
import OnboardingScreen from "../mobile/src/features/welcome/screens/OnboardingScreen";
import { getItem } from "../mobile/src/core/services/storage";

export type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Landing: undefined;
    Register: undefined;
};


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>("Welcome");

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
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash" screenOptions={{ headerShown: false }} >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Landing" component={LandingScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Navigator>
        </NavigationContainer>

    );
}
