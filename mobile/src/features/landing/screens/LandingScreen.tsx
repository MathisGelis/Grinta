import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../mobile/src/navigation/RootNavigator";

type NavigationProps = NativeStackNavigationProp<RootStackParamList, "Landing">;

export default function LandingScreen() {
    const navigation = useNavigation<NavigationProps>();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Grinta 💪</Text>
            <Text style={styles.subtitle}>
                Track your workouts, connect with others, and push your limits.
            </Text>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Register")}>
                <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: "#bbb",
        textAlign: "center",
        marginBottom: 30,
    },
    button: {
        backgroundColor: "#7B61FF",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
