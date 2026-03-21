import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS, Lang } from "@/i18n/translations";

export default function SettingsLanguageScreen() {
  const { t, lang, setLang } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = LANGUAGE_OPTIONS.filter(
    (l) =>
      l.label.toLowerCase().includes(query.toLowerCase()) ||
      l.nativeLabel.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.language}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#555" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.search}
          placeholderTextColor="#555"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.langItem}
            onPress={() => {
              setLang(item.code as Lang);
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.langLabel}>{item.label}</Text>
              {item.nativeLabel !== item.label && (
                <Text style={styles.langNative}>{item.nativeLabel}</Text>
              )}
            </View>
            {lang === item.code && (
              <View style={styles.checkWrap}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
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
    paddingBottom: 16,
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

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },

  separator: { height: 1, backgroundColor: "#1e1e1e", marginHorizontal: 0 },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 4,
  },
  langLabel: { color: "#fff", fontSize: 15 },
  langNative: { color: "#666", fontSize: 12, marginTop: 2 },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#7B5CF0",
    alignItems: "center",
    justifyContent: "center",
  },
});
