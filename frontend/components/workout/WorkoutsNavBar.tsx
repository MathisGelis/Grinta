import React from "react";
import { View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/contexts/LanguageContext";
import SegmentedControl from "@/components/ui/SegmentedControl";

type Route = "/workouts" | "/workouts/programms" | "/workouts/exercises";

export function WorkoutsNavBar() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const active: Route = pathname.includes("exercises")
    ? "/workouts/exercises"
    : pathname.includes("programms")
      ? "/workouts/programms"
      : "/workouts";

  return (
    <View style={{ paddingTop: insets.top + 12 }} className="px-5 pb-4">
      <SegmentedControl<Route>
        variant="glass"
        id="workouts-nav"
        value={active}
        onChange={(route) => router.navigate(route)}
        options={[
          { value: "/workouts", label: t.sessions },
          { value: "/workouts/programms", label: t.programmes },
          { value: "/workouts/exercises", label: t.exercises },
        ]}
      />
    </View>
  );
}
