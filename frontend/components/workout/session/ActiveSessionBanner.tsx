import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Glass from "@/components/ui/Glass";
import PressableScale from "@/components/ui/PressableScale";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { resumeSession } from "@/hooks/useActiveSession";
import { useTranslation } from "@/contexts/LanguageContext";
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session) return;
    setElapsed(elapsedSince(session));
    const interval = setInterval(() => setElapsed(elapsedSince(session)), 1000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 bottom-0 px-5"
      style={{ paddingBottom: insets.bottom + 8 + 68 + 12 }}
    >
      <PressableScale
        onPress={() => resumeSession(session)}
        accessibilityRole="button"
        accessibilityLabel={t.workoutInProgress}
      >
        <Glass
          intensity={40}
          className="flex-row items-center rounded-full py-2.5 pl-2.5 pr-4"
          style={{ borderCurve: "continuous" }}
        >
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-accent">
            <Ionicons
              name="barbell"
              size={18}
              color={WorkoutTheme.text.primary}
            />
          </View>

          <View className="flex-1">
            <Text className="text-xs text-ink-muted">
              {t.workoutInProgress}
            </Text>
            <Text numberOfLines={1} className="text-sm font-semibold text-ink">
              {session.workoutName}
            </Text>
          </View>

          <Text
            className="mr-2 text-sm font-semibold text-accent"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatSessionTime(elapsed)}
          </Text>
          <Ionicons
            name="chevron-up"
            size={18}
            color={WorkoutTheme.text.tertiary}
          />
        </Glass>
      </PressableScale>
    </View>
  );
}
