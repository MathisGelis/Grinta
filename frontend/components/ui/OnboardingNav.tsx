import React, { useCallback, useRef } from "react";
import { View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import IconButton from "./IconButton";
import SkipLink from "./SkipLink";

/** Ignore les appuis répétés: une seule navigation à la fois, déverrouillée au retour sur l'écran. */
export function useNavLock() {
  const locked = useRef(false);
  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );
  return useCallback((action: () => void | Promise<unknown>) => {
    if (locked.current) return;
    locked.current = true;
    const unlock = () => setTimeout(() => (locked.current = false), 800);
    try {
      Promise.resolve(action()).finally(unlock);
    } catch (err) {
      unlock();
      throw err;
    }
  }, []);
}

type Props = {
  onNext: () => void | Promise<unknown>;
  nextLabel: string;
  onBack?: () => void;
  /** Masque le bouton de gauche (première page). */
  hideBack?: boolean;
  backLabel?: string;
  onSkip?: () => void | Promise<unknown>;
  skipLabel?: string;
  loading?: boolean;
  nextDisabled?: boolean;
};

/** Barre du bas de l'onboarding: chevron gauche (verre), « Passer » au centre, chevron droit (violet). */
export default function OnboardingNav({
  onNext,
  nextLabel,
  onBack,
  hideBack,
  backLabel = "Back",
  onSkip,
  skipLabel,
  loading,
  nextDisabled,
}: Props) {
  const once = useNavLock();
  const off = nextDisabled || loading;

  return (
    <View>
      <View className="flex-row items-center justify-between pb-12 pt-4">
        {hideBack ? (
          <View style={{ width: 52, height: 52 }} />
        ) : (
          <IconButton
            icon="chevron-back"
            variant="glass"
            size={52}
            label={backLabel}
            onPress={() => once(onBack ?? (() => router.back()))}
          />
        )}
        <View className="flex-1 items-center">
          {onSkip && skipLabel ? (
            <SkipLink label={skipLabel} onPress={() => once(onSkip)} />
          ) : null}
        </View>
        <View style={{ opacity: nextDisabled ? 0.4 : 1 }} pointerEvents={nextDisabled ? "none" : "auto"}>
          <IconButton
            icon={loading ? "hourglass-outline" : "chevron-forward"}
            variant="accent"
            size={52}
            label={nextLabel}
            onPress={off ? undefined : () => once(onNext)}
          />
        </View>
      </View>
    </View>
  );
}
