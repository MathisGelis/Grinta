import { Stack, router, usePathname } from "expo-router";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchProvider, useSearch } from "@/contexts/SearchContext";

function ExploreHeader() {
  const pathname = usePathname();
  const isSearchPage = pathname.endsWith("/search");
  const { query, handleSearch, clearSearch } = useSearch();

  const handleBack = () => {
    clearSearch();
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} className="bg-[#1a1a1a] pb-3">
      <Text className="text-xl font-bold text-white text-center mb-3">
        Explore
      </Text>
      {isSearchPage ? (
        <View className="flex-row items-center px-4 gap-3">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center bg-[#2e2e2e] rounded-xl"
            onPress={handleBack}
          >
            <Ionicons name="chevron-back-outline" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center gap-2 bg-[#2e2e2e] rounded-full px-4 py-2">
            <Ionicons name="search-outline" size={18} color="#888" />
            <TextInput
              placeholder="Search users..."
              placeholderTextColor="#555"
              className="flex-1 text-base text-white"
              value={query}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>
        </View>
      ) : (
        <View className="flex-row items-center px-4 gap-3">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center bg-[#2e2e2e] rounded-xl"
            onPress={() => router.push("/(tabs)/explore/notification")}
          >
            <Ionicons name="notifications-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center gap-2 bg-[#2e2e2e] rounded-full px-4 py-2"
            onPress={() => router.push("/(tabs)/explore/search")}
          >
            <Ionicons name="search-outline" size={18} color="#888" />
            <Text className="flex-1 text-base text-gray-500">Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-10 h-10 items-center justify-center bg-[#2e2e2e] rounded-xl"
            onPress={() => router.push("/(tabs)/social" as any)}
          >
            <Ionicons name="people-outline" size={20} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-10 h-10 items-center justify-center bg-[#2e2e2e] rounded-xl"
            onPress={() => router.push("/(tabs)/explore/chat")}
          >
            <Ionicons name="paper-plane-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function ExploreLayout() {
  const pathname = usePathname();

  // notification et chat sont de vraies pages plein écran, sans le header
  const hideHeader =
    pathname.endsWith("/notification") || pathname.endsWith("/chat");

  return (
    <SearchProvider>
      <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
        {!hideHeader && <ExploreHeader />}

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen
            name="search"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="notification"
            options={{ animation: "slide_from_left" }}
          />
          <Stack.Screen name="chat" />
        </Stack>
      </View>
    </SearchProvider>
  );
}
