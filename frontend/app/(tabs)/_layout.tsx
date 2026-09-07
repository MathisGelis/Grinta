import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { WorkoutTheme } from "@/constants/Colors";
import ActiveSessionBanner from "@/components/workout/session/ActiveSessionBanner";
import {
  resumeSession,
  useActiveSession,
} from "@/hooks/useActiveSession";

export default function Layout() {
  const router = useRouter();
  const session = useActiveSession();

  return (
    <View style={{ flex: 1 }}>
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
            tabBarButton: (props) => (
              <CenterCreateButton {...props} active={session != null} />
            ),
          }}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
              // With a session running the button is a way back into it,
              // not a way to start another one.
              if (session) resumeSession(session);
              else router.push("/(workout)/current");
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
      <ActiveSessionBanner session={session} />
    </View>
  );
}

function CenterCreateButton({
  onPress,
  active = false,
}: {
  onPress?: () => void;
  active?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [active, pulseAnim]);

  const haloScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });
  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

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
          {active && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.pulseHalo,
                { opacity: haloOpacity, transform: [{ scale: haloScale }] },
              ]}
            />
          )}
          <View style={styles.centerButton}>
            <Ionicons
              name={active ? "pulse" : "add"}
              size={active ? 30 : 40}
              color="white"
            />
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

    elevation: 10,
    shadowColor: "#7B5CF0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,

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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(123, 92, 240, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: WorkoutTheme.accent.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pulseHalo: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: WorkoutTheme.accent.purple,
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
