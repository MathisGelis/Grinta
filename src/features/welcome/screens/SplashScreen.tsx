import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@navigation/RootNavigator";

type NavigationProps = NativeStackNavigationProp<RootStackParamList, "Splash">;

export default function SplashScreen() {
    const navigation = useNavigation<NavigationProps>();
    const opacity = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                navigation.replace("Onboarding"); // 👈 transition vers l’onboarding
            }, 1500);
        });
    }, []);

    return (
        <View style={styles.container}>
            <Animated.Text style={[styles.logo, { opacity }]}>Grinta</Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
    },
    logo: {
        fontSize: 42,
        color: "#A56BFF",
        fontWeight: "bold",
    },
});
