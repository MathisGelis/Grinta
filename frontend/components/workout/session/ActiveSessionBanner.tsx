import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { resumeSession } from "@/hooks/useActiveSession";
import {
  ActiveSession,
  elapsedSince,
  formatSessionTime,
} from "@/services/active-session.service";

export default function ActiveSessionBanner({
  session,
}: {
  session: ActiveSession | null;
}) {
  const [elapsed, setElapsed] = useState(0);

  // The ticking clock lives here rather than in the hook so the once-a-second
  // re-render stays inside the banner instead of redrawing the whole tab bar.
  useEffect(() => {
    if (!session) return;
    setElapsed(elapsedSince(session));
    const interval = setInterval(() => setElapsed(elapsedSince(session)), 1000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  return (
    <TouchableOpacity
      onPress={() => resumeSession(session)}
      activeOpacity={0.85}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 96,
        backgroundColor: WorkoutTheme.backgroundTertiary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: WorkoutTheme.accent.purple,
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: WorkoutTheme.accent.purple,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(124, 93, 183, 0.2)",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name="barbell" size={18} color={WorkoutTheme.accent.purple} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: WorkoutTheme.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Séance en cours
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: WorkoutTheme.text.primary,
            marginTop: 2,
          }}
        >
          {session.workoutName}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: WorkoutTheme.accent.purple,
          marginRight: 8,
        }}
      >
        {formatSessionTime(elapsed)}
      </Text>
      <Ionicons
        name="chevron-up"
        size={20}
        color={WorkoutTheme.text.secondary}
      />
    </TouchableOpacity>
  );
}
