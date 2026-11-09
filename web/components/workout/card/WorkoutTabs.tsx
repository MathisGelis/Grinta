import React from "react";
import { View } from "react-native";
import SegmentedControl from "@/components/ui/SegmentedControl";

import { useTranslation } from "@/contexts/LanguageContext";
interface WorkoutTabsProps {
  activeTab: "infos" | "stats";
  onTabChange: (tab: "infos" | "stats") => void;
}

export default function WorkoutTabs({
  activeTab,
  onTabChange,
}: WorkoutTabsProps) {
  const { t } = useTranslation();
  return (
    <View className="px-5 pb-4">
      <SegmentedControl<"infos" | "stats">
        id="workout-card-tabs"
        value={activeTab}
        onChange={onTabChange}
        options={[
          { value: "infos", label: t.infoTab },
          { value: "stats", label: t.statsTab },
        ]}
      />
    </View>
  );
}
