import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { saveItem } from "@core/services/storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@navigation/RootNavigator";

type NavigationProps = NativeStackNavigationProp<RootStackParamList, "Welcome">;

export default function WelcomeScreen() {
    const navigation = useNavigation<NavigationProps>();

    const handleStart = () => {
        saveItem("hasSeenWelcome", "true"); // 🔒 on stocke une info locale
        navigation.replace("Landing"); // 👈 on redirige sans retour possible
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Grinta 💪</Text>
            <Text style={styles.subtitle}>Let’s get you started.</Text>
            <TouchableOpacity style={styles.button} onPress={handleStart}>
                <Text style={styles.buttonText}>Continue</Text>
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
        color: "#fff",
        fontWeight: "bold",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: "#bbb",
        marginBottom: 30,
    },
    button: {
        backgroundColor: "#7B61FF",
        padding: 14,
        borderRadius: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
