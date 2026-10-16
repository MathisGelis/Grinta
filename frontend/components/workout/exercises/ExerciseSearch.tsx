import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { getAllExercises, Exercise } from "@/services/exercises.service";

import PressableScale from "@/components/ui/PressableScale";
import IconButton from "@/components/ui/IconButton";
import { useTranslation } from "@/contexts/LanguageContext";
interface ExerciseSearchProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  existingExerciseIds?: string[];
}

export default function ExerciseSearch({
  visible,
  onClose,
  onSelectExercise,
  existingExerciseIds = [],
}: ExerciseSearchProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  const loadExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      const allExercises = await getAllExercises();
      setAvailableExercises(allExercises);
      setFilteredExercises(allExercises);
    } catch (error) {
      Alert.alert(t.error, t.cannotLoadExercises);
      console.error("Erreur:", error);
    } finally {
      setLoadingExercises(false);
    }
  }, [t]);

  useEffect(() => {
    if (visible && availableExercises.length === 0) {
      loadExercises();
    }
  }, [visible, availableExercises.length, loadExercises]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = availableExercises.filter((ex) =>
      ex.name.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredExercises(filtered);
  };

  const handleSelect = (exercise: Exercise) => {
    onSelectExercise(exercise);
    setSearchQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-overlay justify-end">
        <View className="h-[80%] max-h-[90%] min-h-[50%] rounded-t-hero bg-surface pt-3">
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-raised" />
          <View className="flex-row items-center justify-between px-5 pb-4">
            <Text className="text-xl font-semibold text-ink">
              {t.addExerciseTitle}
            </Text>
            <IconButton icon="close" label={t.closeLabel} onPress={onClose} />
          </View>

          <View className="px-5 pb-3">
            <View className="h-12 flex-row items-center rounded-full bg-raised px-4">
              <Ionicons
                name="search"
                size={18}
                color={WorkoutTheme.text.secondary}
              />
              <TextInput
                className="h-full flex-1 px-2.5 py-0 text-[15px] text-ink"
                placeholder={t.searchExercise}
                placeholderTextColor={WorkoutTheme.text.tertiary}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <PressableScale onPress={() => handleSearch("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={WorkoutTheme.text.secondary}
                  />
                </PressableScale>
              )}
            </View>
          </View>

          {loadingExercises ? (
            <View className="flex-1 justify-center items-center py-10">
              <ActivityIndicator
                size="large"
                color={WorkoutTheme.accent.purple}
              />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                flexGrow: 1,
              }}
              renderItem={({ item }) => {
                const isDuplicate = existingExerciseIds.includes(item.id);

                return (
                  <PressableScale
                    onPress={() =>
                      isDuplicate
                        ? Alert.alert(
                            t.duplicateExercise,
                            `"${item.name}" ${t.alreadyAdded}`,
                          )
                        : handleSelect(item)
                    }
                    disabled={isDuplicate}
                    className={`mb-2 flex-row items-center justify-between rounded-tile bg-raised p-4 ${isDuplicate ? "opacity-60" : ""}`}
                  >
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-ink">
                        {item.name}
                      </Text>
                      <Text className="mt-0.5 text-xs capitalize text-ink-muted">
                        {item.primary_muscle}
                      </Text>
                    </View>
                    <Ionicons
                      name={isDuplicate ? "checkmark-circle" : "add-circle"}
                      size={24}
                      color={
                        isDuplicate
                          ? WorkoutTheme.status.success
                          : WorkoutTheme.accent.purple
                      }
                    />
                  </PressableScale>
                );
              }}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center">
                  <Ionicons
                    name="search"
                    size={40}
                    color={WorkoutTheme.text.tertiary}
                  />
                  <Text className="text-sm text-ink-soft mt-4">
                    {t.noExerciseFound}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
