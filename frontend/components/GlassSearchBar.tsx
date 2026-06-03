import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

interface GlassSearchBarProps {
  items: string[];
  onResults: (filtered: string[]) => void;
  onAdd: () => void;
  placeholder?: string;
  filter?: () => void;
}

export default function GlassSearchBar({
  items,
  onResults,
  onAdd,
  placeholder = "Rechercher…",
  filter,
}: GlassSearchBarProps) {
  const handleSearch = (query: string) => {
    const filtered = items.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
    onResults(filtered);
  };

  return (
    <View className="flex-row gap-3 items-center">
      {filter && (
        <BlurView
          intensity={60}
          tint="dark"
          className="w-12 h-12 rounded-2xl overflow-hidden items-center justify-center"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}
        >
          <View
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />
          <TouchableOpacity onPress={filter}>
            <Ionicons name="options" size={20} color="grey" />
          </TouchableOpacity>
        </BlurView>
      )}
      {/* Search Bar */}
      <BlurView
        intensity={60}
        tint="dark"
        className="flex-1 flex-row items-center gap-3 px-4 rounded-2xl overflow-hidden"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }}
      >
        <View
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        />
        <Ionicons
          name="search-outline"
          size={18}
          color="rgba(255,255,255,0.5)"
        />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          className="flex-1 py-3 text-white text-[15px]"
          onChangeText={handleSearch}
        />
      </BlurView>

      {/* Add Button */}
      <BlurView
        intensity={60}
        tint="dark"
        className="w-12 h-12 rounded-2xl overflow-hidden items-center justify-center"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}
      >
        <View
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        />
        <TouchableOpacity
          className="w-full h-full items-center justify-center"
          onPress={onAdd}
        >
          <Ionicons name="add" size={24} color="grey" />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}
