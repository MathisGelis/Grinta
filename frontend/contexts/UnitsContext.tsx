import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UnitSystem = "metric" | "imperial";

const STORAGE_KEY = "units";
const KG_PER_LB = 0.45359237;

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

interface UnitsContextType {
  system: UnitSystem;
  setSystem: (system: UnitSystem) => void;
  weightUnit: "kg" | "lb";
  /** Poids stockés en kg, affichés dans l'unité choisie. */
  fromKg: (kg: number, digits?: number) => number;
  /** Valeur saisie dans l'unité choisie, convertie en kg (2 décimales). */
  toKg: (value: number) => number;
  formatWeight: (kg: number, digits?: number) => string;
  formatVolume: (kg: number) => string;
}

const UnitsContext = createContext<UnitsContextType>({
  system: "metric",
  setSystem: () => {},
  weightUnit: "kg",
  fromKg: (kg, digits = 1) => round(kg, digits),
  toKg: (value) => value,
  formatWeight: (kg, digits = 1) => `${round(kg, digits)} kg`,
  formatVolume: (kg) => (kg >= 1000 ? `${(kg / 1000).toFixed(1)} T` : `${Math.round(kg)} kg`),
});

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [system, setSystemState] = useState<UnitSystem>("metric");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "metric" || stored === "imperial") setSystemState(stored);
      })
      .catch(() => {});
  }, []);

  const setSystem = useCallback((next: UnitSystem) => {
    setSystemState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<UnitsContextType>(() => {
    const imperial = system === "imperial";
    const fromKg = (kg: number, digits = 1) => round(imperial ? kg / KG_PER_LB : kg, digits);
    const weightUnit = imperial ? "lb" : "kg";
    return {
      system,
      setSystem,
      weightUnit,
      fromKg,
      toKg: (input) => round(imperial ? input * KG_PER_LB : input, 2),
      formatWeight: (kg, digits = 1) => `${fromKg(kg, digits)} ${weightUnit}`,
      formatVolume: (kg) =>
        !imperial && kg >= 1000
          ? `${(kg / 1000).toFixed(1)} T`
          : `${Math.round(fromKg(kg, 0))} ${weightUnit}`,
    };
  }, [system, setSystem]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  return useContext(UnitsContext);
}
