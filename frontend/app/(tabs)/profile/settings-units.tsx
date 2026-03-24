import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/contexts/LanguageContext";

export default function SettingsUnitsScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<"metric" | "imperial">("metric");

  const choose = async (val: "metric" | "imperial") => {
    setSelected(val);
    await AsyncStorage.setItem("units", val);
  };

  const options = [
    { value: "metric" as const, label: t.metric },
    { value: "imperial" as const, label: t.imperial },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.unitsOfMeasure}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.menuSection}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.menuItem, i < options.length - 1 && styles.menuItemBorder]}
            onPress={() => choose(opt.value)}
          >
            <Text style={styles.menuLabel}>{opt.label}</Text>
            <View style={[styles.radio, selected === opt.value && styles.radioSelected]}>
              {selected === opt.value && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  menuSection: {
    marginHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#2a2a2a" },
  menuLabel: { flex: 1, color: "#fff", fontSize: 15 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#555",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: "#7B5CF0" },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#7B5CF0",
  },
});
