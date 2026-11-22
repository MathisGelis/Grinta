import React from "react";
import { View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/contexts/LanguageContext";
import SegmentedControl from "@/components/ui/SegmentedControl";

type Route = "/workouts" | "/workouts/exercises";

/** Menu Création / Exercices : un élément normal du haut de chaque page, sans animation liée au défilement. */
export function WorkoutsNavBar({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const active: Route = pathname.includes("exercises")
    ? "/workouts/exercises"
    : "/workouts";

  return (
    <View
      style={{ paddingTop: insets.top + 12, paddingBottom: compact ? 8 : 16 }}
      className="px-5"
    >
      <SegmentedControl<Route>
        variant="glass"
        id="workouts-nav"
        value={active}
        onChange={(route) => router.navigate(route)}
        options={[
          { value: "/workouts", label: t.creation },
          { value: "/workouts/exercises", label: t.exercises },
        ]}
      />
    </View>
  );
}
