import React, { useState } from "react";
import { View, Text, Switch, Linking } from "react-native";


import { useTranslation } from "@/contexts/LanguageContext";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { WorkoutTheme } from "@/constants/Colors";
export default function SettingsNotificationsScreen() {
  const { t } = useTranslation();
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [programNotifs, setProgramNotifs] = useState(false);

  return (
    <View className="flex-1">
      <ScreenHeader title={t.notificationsSettings} />

      <View className="mx-5 bg-surface rounded-card overflow-hidden">
        <View className="flex-row items-center px-5 py-[18px]">
          <Text className="flex-1 text-ink text-[15px]">{t.workoutReminders}</Text>
          <Switch
            value={workoutReminders}
            onValueChange={setWorkoutReminders}
            trackColor={{ false: WorkoutTheme.border, true: WorkoutTheme.accent.purple }}
            thumbColor={WorkoutTheme.text.primary}
          />
        </View>
        <View className="flex-row items-center px-5 py-[18px]">
          <Text className="flex-1 text-ink text-[15px]">{t.programNotifications}</Text>
          <Switch
            value={programNotifs}
            onValueChange={setProgramNotifs}
            trackColor={{ false: WorkoutTheme.border, true: WorkoutTheme.accent.purple }}
            thumbColor={WorkoutTheme.text.primary}
          />
        </View>
      </View>

      <Text className="text-ink-faint text-[13px] text-center mt-8 px-8 leading-[20px]">
        {t.phoneSettingsNote}{" "}
        <Text
          className="text-accent-light"
          onPress={() => Linking.openSettings()}
        >
          {t.phoneSettingsLink}
        </Text>
      </Text>
    </View>
  );
}
