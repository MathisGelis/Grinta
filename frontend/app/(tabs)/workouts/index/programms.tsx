import React, { useCallback, useState } from "react";
import { View, Text, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GlassSearchBar from "@/components/GlassSearchBar";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { useFocusEffect, router } from "expo-router";
import { getProgramms, SmallProgramm } from "@/services/programms.service";
import ProgrammCard from "@/components/workoutCreation/ProgrammCard";

export default function ProgramsScreen() {
  const { keyboardY, bottomOffset } = useKeyboardOffset();
  const [programms, setProgramms] = useState<SmallProgramm[]>([]);
  const [filteredProgramms, setFilteredProgramms] = useState<SmallProgramm[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadProgramms = useCallback(async () => {
    try {
      setError(null);
      const programms = await getProgramms();
      setProgramms(programms);
      setFilteredProgramms(programms);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchResults = (filteredNames: string[]) => {
    const filtered = programms.filter((p) => filteredNames.includes(p.title));
    setFilteredProgramms(filtered);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProgramms();
    }, [loadProgramms]),
  );

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="flex-1 bg-[#0F0F0F]"
    >
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Chargement des exercices...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : filteredProgramms.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Aucun programme trouvé.</Text>
        </View>
      ) : (
        <ScrollView
          className="px-4 pb-24 pt-4"
          contentContainerStyle={{ paddingBottom: bottomOffset + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredProgramms.map((programm) => (
            <ProgrammCard
              key={programm.id}
              program={programm}
              onUpdate={(updated) => {
                setProgramms((prev) =>
                  prev.map((item) => (item.id === updated.id ? updated : item)),
                );
                setFilteredProgramms((prev) =>
                  prev.map((item) => (item.id === updated.id ? updated : item)),
                );
              }}
              onDelete={(id) => {
                setProgramms((prev) => prev.filter((item) => item.id !== id));
                setFilteredProgramms((prev) =>
                  prev.filter((item) => item.id !== id),
                );
              }}
            />
          ))}
        </ScrollView>
      )}
      <Animated.View
        className="absolute left-0 right-0 px-4"
        style={{
          bottom: bottomOffset + 8,
          transform: [{ translateY: keyboardY }],
        }}
      >
        <GlassSearchBar
          items={programms.map((p) => p.title)}
          onResults={handleSearchResults}
          onAdd={() => router.push("/(tabs)/workouts/createProgramm")}
          placeholder="Rechercher un programme…"
        />
      </Animated.View>
    </SafeAreaView>
  );
}
