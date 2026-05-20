import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { getAllExercises, Exercise } from "@/services/exercises.service";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (visible && availableExercises.length === 0) {
      loadExercises();
    }
  }, [visible, availableExercises.length]);

  const loadExercises = async () => {
    setLoadingExercises(true);
    try {
      const allExercises = await getAllExercises();
      setAvailableExercises(allExercises);
      setFilteredExercises(allExercises);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les exercices");
      console.error("Erreur:", error);
    } finally {
      setLoadingExercises(false);
    }
  };

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
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: WorkoutTheme.backgroundSecondary,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: "80%",
            maxHeight: "90%",
            minHeight: "50%",
            paddingTop: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: WorkoutTheme.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: WorkoutTheme.text.primary,
              }}
            >
              Ajouter un exercice
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={WorkoutTheme.text.primary}
              />
            </TouchableOpacity>
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: WorkoutTheme.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: WorkoutTheme.backgroundTertiary,
                borderRadius: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: WorkoutTheme.border,
              }}
            >
              <Ionicons
                name="search"
                size={18}
                color={WorkoutTheme.text.secondary}
              />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  fontSize: 14,
                  color: WorkoutTheme.text.primary,
                }}
                placeholder="Rechercher un exercice..."
                placeholderTextColor={WorkoutTheme.text.tertiary}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={WorkoutTheme.text.secondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loadingExercises ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 40,
              }}
            >
              <ActivityIndicator
                size="large"
                color={WorkoutTheme.accent.purple}
              />
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexGrow: 1,
              }}
              renderItem={({ item }) => {
                const isDuplicate = existingExerciseIds.includes(item.id);

                return (
                  <TouchableOpacity
                    onPress={() =>
                      isDuplicate
                        ? Alert.alert(
                            "Exercice en doublon",
                            `"${item.name}" est déjà ajouté à la séance.`,
                          )
                        : handleSelect(item)
                    }
                    disabled={isDuplicate}
                    style={{
                      backgroundColor: isDuplicate
                        ? WorkoutTheme.backgroundTertiary + "80"
                        : WorkoutTheme.backgroundTertiary,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: isDuplicate
                        ? WorkoutTheme.border
                        : WorkoutTheme.border,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      opacity: isDuplicate ? 0.6 : 1,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: WorkoutTheme.text.primary,
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: WorkoutTheme.text.secondary,
                          marginTop: 4,
                          textTransform: "capitalize",
                        }}
                      >
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
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="search"
                    size={40}
                    color={WorkoutTheme.text.tertiary}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: WorkoutTheme.text.secondary,
                      marginTop: 16,
                    }}
                  >
                    Aucun exercice trouvé
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
