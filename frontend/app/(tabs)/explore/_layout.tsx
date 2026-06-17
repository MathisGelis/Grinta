import { Stack, router } from "expo-router";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

function ExploreHeader() {
  return (
    <SafeAreaView edges={["top"]} className="bg-[#1a1a1a] pb-3">
      <Text className="text-xl font-bold text-white text-center mb-3">
        Home
      </Text>
      <View className="flex-row items-center px-4 gap-3">
        <TouchableOpacity
          className="w-10 h-10 items-center justify-center bg-[#2e2e2e] rounded-xl"
          onPress={() => router.push("/(tabs)/explore/notification")}
        >
          <Ionicons name="notifications-outline" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-[#2e2e2e] rounded-full px-4 py-2">
          <Ionicons name="search-outline" size={18} color="#888" />
          <TextInput
            placeholder="Search workouts"
            placeholderTextColor="#555"
            className="ml-2 flex-1 text-base text-white"
          />
        </View>

        <TouchableOpacity
          className="w-10 h-10 items-center justify-center bg-[#2e2e2e] rounded-xl"
          onPress={() => router.push("/(tabs)/explore/chat")}
        >
          <Ionicons name="paper-plane-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function ExploreStack() {
  return (
    <Stack
      screenOptions={{
        header: () => <ExploreHeader />,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="notification" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
    </Stack>
  );
}
