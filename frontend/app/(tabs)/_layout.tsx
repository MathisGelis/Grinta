import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View, Animated } from "react-native";
import { useRef } from "react";
import { WorkoutTheme } from "@/constants/Colors";

export default function Layout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#555",

        tabBarItemStyle: {
          flex: 1,
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarIconStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "barbell" : "barbell-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Center Create Button */}
      <Tabs.Screen
        name="workout-trigger"
        options={{
          tabBarButton: (props) => <CenterCreateButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push("/(workout)/current");
          },
        })}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function CenterCreateButton({ onPress }: { onPress?: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.centerButtonWrapper}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View style={styles.glowRing}>
          <View style={styles.centerButton}>
            <Ionicons name="add" size={40} color="white" />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#1a1a1a",
    borderTopWidth: 0,
    height: 64,

    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 32,

    position: "absolute",
    left: 0,
    right: 0,

    elevation: 0,
    shadowOpacity: 0,

    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    paddingTop: 0,
    paddingBottom: 0,
  },
  centerButtonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glowRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(123, 92, 240, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: WorkoutTheme.accent.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  centerButton: {
    width: 55,
    height: 55,
    borderRadius: 35,
    backgroundColor: WorkoutTheme.accent.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  centerButtonWrapper: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
