import React, { useRef, useState } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, Text, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { slides } from "../data/slides";
import OnboardingSlide from "../components/OnboardingSlide";
import { saveItem } from "@core/services/storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@navigation/RootNavigator";

type NavigationProps = NativeStackNavigationProp<RootStackParamList, "Onboarding">;

export default function OnboardingScreen() {
    const navigation = useNavigation<NavigationProps>();
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) setCurrentSlide(viewableItems[0].index);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleStart = () => {
        saveItem("hasSeenWelcome", "true");
        navigation.replace("Landing");
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={slides}
                renderItem={({ item }) => <OnboardingSlide item={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
            />

            {/* Dots */}
            <View style={styles.dotsContainer}>
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentSlide === index && styles.activeDot,
                        ]}
                    />
                ))}
            </View>

            {/* Button */}
            {currentSlide === slides.length - 1 && (
                <TouchableOpacity style={styles.button} onPress={handleStart}>
                    <Text style={styles.buttonText}>Start Now →</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#121212" },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 5,
        backgroundColor: "#444",
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: "#A56BFF",
        width: 16,
    },
    button: {
        backgroundColor: "#A56BFF",
        alignSelf: "center",
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 30,
        position: "absolute",
        bottom: 60,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});
