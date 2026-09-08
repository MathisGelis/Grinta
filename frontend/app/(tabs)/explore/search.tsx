import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";
import { useSearch } from "@/contexts/SearchContext";
import SearchUserCard from "@/components/explorePage/SearchUserCard";

export default function SearchScreen() {
  const { query, results, loading, searchAttempted } = useSearch();

  return (
    <View
      style={{
        backgroundColor: WorkoutTheme.background,
        flex: 1,
      }}
    >
      {/* Results ScrollView */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : searchAttempted && results.length === 0 && query.trim() ? (
          <View className="items-center justify-center py-8">
            <Text className="text-gray-400 text-base">
              No users found for &apos;{query}&apos;
            </Text>
          </View>
        ) : results.length > 0 ? (
          <View>
            {results.map((user) => (
              <SearchUserCard key={user.id} user={user} />
            ))}
          </View>
        ) : searchAttempted ? null : (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 text-center">
              Start typing to search for users
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
