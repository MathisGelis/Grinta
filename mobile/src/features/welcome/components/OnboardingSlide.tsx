import React from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default function OnboardingSlide({ item }: { item: any }) {
    return (
        <View style={[styles.container, { width }]}>
            <Image source={item.image} style={styles.image} resizeMode="cover" />
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
    },
    image: {
        width: "100%",
        height: height * 0.65,
    },
    textContainer: {
        alignItems: "center",
        marginTop: 20,
    },
    title: {
        fontSize: 20,
        color: "#fff",
    },
    subtitle: {
        fontSize: 20,
        color: "#fff",
        fontWeight: "bold",
    },
});
