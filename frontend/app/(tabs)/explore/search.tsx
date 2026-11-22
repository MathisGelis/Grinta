import React, { useEffect, useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FLOATING_HEADER_OFFSET } from "@/components/ui/Screen";
import { ConnectionsService } from "@/services/connections.service";
import { SearchUser } from "@/services/user.service";
import { useSearch } from "@/contexts/SearchContext";
import SearchUserCard from "@/components/explorePage/SearchUserCard";

import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { UserListSkeleton } from "@/components/ui/skeletons";
import EmptyState from "@/components/ui/EmptyState";
export default function SearchScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { query, results, loading, searchAttempted } = useSearch();
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);

  useEffect(() => {
    ConnectionsService.getRecommendations()
      .then((recs) => setSuggestions(recs as SearchUser[]))
      .catch(() => setSuggestions([]));
  }, []);

  return (
    <View
      className="flex-1"
    >
      <ScrollView {...chromeScrollProps}
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + FLOATING_HEADER_OFFSET + 8,
          paddingBottom: 16,
        }}
      >
        {loading ? (
          <UserListSkeleton count={6} action />
        ) : searchAttempted && results.length === 0 && query.trim() ? (
          <EmptyState icon="search-outline" title={format(t.noUsersFound, { query })} />
        ) : results.length > 0 ? (
          <View className="gap-3">
            {results.map((user) => (
              <SearchUserCard key={user.id} user={user} />
            ))}
          </View>
        ) : !query.trim() && suggestions.length > 0 ? (
          <View className="gap-3">
            <Text className="text-ink-muted text-[13px] font-semibold uppercase tracking-[0.5px]">
              {t.suggestions}
            </Text>
            {suggestions.map((user) => (
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
