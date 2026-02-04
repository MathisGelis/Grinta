import { Stack } from "expo-router";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

function ExploreHeader() {
  return (
    <SafeAreaView edges={["top"]} className="bg-white pt-2 pb-3">
      <Text className="text-xl font-bold text-gray-900 text-center mb-3">
        Home
      </Text>

      <View className="flex-row items-center px-4 gap-3">
        <View className="flex-[8] flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            placeholder="Search workouts"
            placeholderTextColor="#999"
            className="ml-2 flex-1 text-base text-gray-900"
          />
        </View>

        <TouchableOpacity className="flex-[2] items-center justify-center">
          <Ionicons name="paper-plane-outline" size={24} color="#000" />
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
    </Stack>
  );
}
