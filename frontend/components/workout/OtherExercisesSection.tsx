import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";
import { WorkoutExercise } from "@/services/workouts.service";
import { getAllExercises, Exercise } from "@/services/exercises.service";

interface OtherExercisesSectionProps {
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  onSelectExercise: (index: number) => void;
  onAddExercise: (exercise: WorkoutExercise) => void;
  completedExercises: number[];
}

export default function OtherExercisesSection({
  exercises,
  currentExerciseIndex,
  onSelectExercise,
  onAddExercise,
  completedExercises,
}: OtherExercisesSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    if (availableExercises.length === 0) {
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
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = availableExercises.filter((ex) =>
      ex.name.toLowerCase().includes(text.toLowerCase()),
    );
    setFilteredExercises(filtered);
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [{ reps: 10, weight: 0 }],
      plannedRestSeconds: 90,
    };
    onAddExercise(newExercise);
    setShowAddModal(false);
    setSearchQuery("");
  };

  const otherExercises = exercises.filter(
    (_, index) => index !== currentExerciseIndex,
  );

  return (
    <>
      <View
        style={{
          backgroundColor: WorkoutTheme.backgroundTertiary,
          paddingHorizontal: 16,
          paddingVertical: 16,
          marginHorizontal: 16,
          marginVertical: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: WorkoutTheme.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: WorkoutTheme.text.primary,
            }}
          >
            Autres exercices ({otherExercises.length})
          </Text>
          <TouchableOpacity
            onPress={handleOpenAddModal}
            style={{
              backgroundColor: WorkoutTheme.accent.purple,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "white",
              }}
            >
              Ajouter
            </Text>
          </TouchableOpacity>
        </View>

        {otherExercises.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              {otherExercises.map((exercise, index) => {
                const realIndex = exercises.findIndex(
                  (e) => e.exerciseId === exercise.exerciseId,
                );
                const isCompleted = completedExercises.includes(realIndex);

                return (
                  <TouchableOpacity
                    key={exercise.exerciseId}
                    onPress={() => onSelectExercise(realIndex)}
                    style={{
                      backgroundColor: isCompleted
                        ? WorkoutTheme.status.success + "20"
                        : WorkoutTheme.background,
                      borderRadius: 10,
                      padding: 12,
                      borderWidth: 2,
                      borderColor: isCompleted
                        ? WorkoutTheme.status.success
                        : WorkoutTheme.border,
                      minWidth: 140,
                      maxWidth: 140,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons
                        name="barbell"
                        size={14}
                        color={
                          isCompleted
                            ? WorkoutTheme.status.success
                            : WorkoutTheme.accent.purple
                        }
                      />
                      {isCompleted && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={WorkoutTheme.status.success}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: WorkoutTheme.text.primary,
                      }}
                      numberOfLines={2}
                    >
                      {exercise.exerciseName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "500",
                        color: WorkoutTheme.text.secondary,
                        marginTop: 6,
                      }}
                    >
                      {exercise.sets.length} séries
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <Text
              style={{
                fontSize: 13,
                color: WorkoutTheme.text.secondary,
              }}
            >
              Aucun autre exercice
            </Text>
          </View>
        )}
      </View>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
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
              maxHeight: "90%",
              paddingTop: 16,
            }}
          >
            {/* Header */}
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
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={WorkoutTheme.text.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Search */}
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
              </View>
            </View>

            {/* Exercises List */}
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
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleAddExercise(item)}
                    style={{
                      backgroundColor: WorkoutTheme.backgroundTertiary,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: WorkoutTheme.border,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
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
                      name="add-circle"
                      size={24}
                      color={WorkoutTheme.accent.purple}
                    />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Ionicons
                      name="search"
                      size={40}
                      color={WorkoutTheme.text.tertiary}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: WorkoutTheme.text.secondary,
                        marginTop: 12,
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
    </>
  );
}
