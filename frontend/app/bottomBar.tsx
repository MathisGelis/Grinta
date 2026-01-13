import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";

interface BottomBarProps {}

const BottomBar: React.FC<BottomBarProps> = () => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string): boolean => pathname === route;

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/explore")}
      >
        {isActive("/explore") ? (
          <View style={styles.activeItemContainer}>
            <Text style={styles.navIconActive}>📍</Text>
            <Text style={styles.navTextActive}>Explore</Text>
          </View>
        ) : (
          <>
            <Text style={styles.navIcon}>📍</Text>
            <Text style={styles.navText}>Explore</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/workouts")}
      >
        {isActive("/workouts") ? (
          <View style={styles.activeItemContainer}>
            <Text style={styles.navIconActive}>💪</Text>
            <Text style={styles.navTextActive}>Workouts</Text>
          </View>
        ) : (
          <>
            <Text style={styles.navIcon}>💪</Text>
            <Text style={styles.navText}>Workouts</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/stats")}
      >
        {isActive("/stats") ? (
          <View style={styles.activeItemContainer}>
            <Text style={styles.navIconActive}>📊</Text>
            <Text style={styles.navTextActive}>Stats</Text>
          </View>
        ) : (
          <>
            <Text style={styles.navIcon}>📊</Text>
            <Text style={styles.navText}>Stats</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/profile")}
      >
        {isActive("/profile") ? (
          <View style={styles.activeItemContainer}>
            <Text style={styles.navIconActive}>👤</Text>
            <Text style={styles.navTextActive}>Profile</Text>
          </View>
        ) : (
          <>
            <Text style={styles.navIcon}>👤</Text>
            <Text style={styles.navText}>Profile</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeItemContainer: {
    backgroundColor: "#8A2BE2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navIconActive: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  navText: {
    fontSize: 12,
    color: "#333",
  },
  navTextActive: {
    fontSize: 12,
    color: "#FFFFFF",
  },
});

export default BottomBar;
