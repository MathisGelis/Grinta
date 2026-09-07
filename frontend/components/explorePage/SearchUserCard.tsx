import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SearchUser } from "@/services/user.service";

interface SearchUserCardProps {
  user: SearchUser;
}

export default function SearchUserCard({ user }: SearchUserCardProps) {
  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/explore/user-profile",
      params: { userId: user.id },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center justify-between bg-[#2a2a2a] rounded-lg p-4 mb-3"
    >
      <View className="flex-row items-center flex-1">
        {/* User Avatar */}
        <View className="w-14 h-14 rounded-full bg-[#404040] overflow-hidden mr-4">
          {user.image_url ? (
            <Image source={{ uri: user.image_url }} className="w-full h-full" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons name="person" size={28} color="#888" />
            </View>
          )}
        </View>

        {/* User Info */}
        <View className="flex-1">
          <Text className="text-white font-semibold text-[15px]">
            {user.displayName}
          </Text>
          <Text className="text-gray-400 text-[13px]">@{user.uniqueName}</Text>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward-outline" size={20} color="#888" />
    </TouchableOpacity>
  );
}
