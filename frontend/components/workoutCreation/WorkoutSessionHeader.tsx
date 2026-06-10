import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

interface WorkoutSessionHeaderProps {
  workoutTitle: string;
  totalTime: number;
  onMinimize: () => void;
  onEndWorkout: () => void;
}

export default function WorkoutSessionHeader({
  workoutTitle,
  totalTime,
  onMinimize,
  onEndWorkout,
}: WorkoutSessionHeaderProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View
      style={{
        backgroundColor: WorkoutTheme.backgroundTertiary,
        borderBottomWidth: 1,
        borderBottomColor: WorkoutTheme.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: WorkoutTheme.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Séance en cours
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: WorkoutTheme.text.primary,
            marginTop: 4,
          }}
        >
          {workoutTitle}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: WorkoutTheme.background,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginHorizontal: 12,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: WorkoutTheme.accent.purple,
          }}
        >
          {formatTime(totalTime)}
        </Text>
      </View>

      <TouchableOpacity onPress={onMinimize} style={{ padding: 8 }}>
        <Ionicons
          name="chevron-down"
          size={24}
          color={WorkoutTheme.text.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={onEndWorkout} style={{ padding: 8 }}>
        <Ionicons
          name="stop-circle"
          size={24}
          color={WorkoutTheme.status.warning}
        />
      </TouchableOpacity>
    </View>
  );
}
