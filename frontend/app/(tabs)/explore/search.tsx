import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FLOATING_HEADER_OFFSET } from "@/components/ui/Screen";
import { useSearch } from "@/contexts/SearchContext";
import SearchUserCard from "@/components/explorePage/SearchUserCard";

import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
export default function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { query, results, loading, searchAttempted } = useSearch();

  return (
    <View
      className="flex-1"
    >
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + FLOATING_HEADER_OFFSET + 8,
          paddingBottom: 16,
        }}
      >
        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color={WorkoutTheme.text.primary} />
          </View>
        ) : searchAttempted && results.length === 0 && query.trim() ? (
          <View className="items-center justify-center py-8">
            <Text className="text-ink-muted text-base">
              {format(t.noUsersFound, { query })}
            </Text>
          </View>
        ) : results.length > 0 ? (
          <View className="gap-3">
            {results.map((user) => (
              <SearchUserCard key={user.id} user={user} />
            ))}
          </View>
        ) : searchAttempted ? null : (
          <View className="items-center justify-center py-12">
            <Text className="text-ink-muted text-center">
              {t.typeToSearchUsers}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
