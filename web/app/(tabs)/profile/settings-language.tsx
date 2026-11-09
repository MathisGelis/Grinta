import React, { useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, Text, FlatList, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTranslation } from "@/contexts/LanguageContext";
import { LANGUAGE_OPTIONS, Lang } from "@/i18n/translations";

import ScreenHeader from "@/components/ui/ScreenHeader";
import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
export default function SettingsLanguageScreen() {
  const { t, lang, setLang } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = LANGUAGE_OPTIONS.filter(
    (l) =>
      l.label.toLowerCase().includes(query.toLowerCase()) ||
      l.nativeLabel.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View className="flex-1">
      <ScreenHeader title={t.language} />

      <View className="flex-row items-center bg-surface rounded-tile mx-4 mb-4 px-4 py-3">
        <Ionicons name="search" size={18} color={WorkoutTheme.text.disabled} style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 text-ink text-[15px]"
          placeholder={t.search}
          placeholderTextColor={WorkoutTheme.text.disabled}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList {...chromeScrollProps}
        data={filtered}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View className="h-[1px] bg-line mx-0" />}
        renderItem={({ item }) => (
          <PressableScale
            className="flex-row items-center py-[18px] px-1"
            onPress={() => {
              setLang(item.code as Lang);
            }}
          >
            <View className="flex-1">
              <Text className="text-ink text-[15px]">{item.label}</Text>
              {item.nativeLabel !== item.label && (
                <Text className="text-ink-faint text-xs mt-0.5">{item.nativeLabel}</Text>
              )}
            </View>
            {lang === item.code && (
              <View className="w-7 h-7 rounded-full bg-accent items-center justify-center">
                <Ionicons name="checkmark" size={16} color={WorkoutTheme.text.primary} />
              </View>
            )}
          </PressableScale>
        )}
      />
    </View>
  );
}
