import React from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";

export default function RegisterScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create your Grinta account 💪</Text>
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry placeholderTextColor="#aaa" />
            <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry placeholderTextColor="#aaa" />
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#121212",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 30,
        textAlign: "center",
    },
    input: {
        backgroundColor: "#1e1e1e",
        color: "#fff",
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
    },
    button: {
        backgroundColor: "#7B61FF",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
