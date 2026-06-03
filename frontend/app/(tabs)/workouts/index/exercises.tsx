import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Animated,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import GlassSearchBar from "@/components/GlassSearchBar";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import {
  Exercise,
  deleteExercise,
  getAllExercises,
  getUserCreatedExerciseIds,
} from "@/services/exercises.service";
import { TokenService } from "@/services/token.service";
import { useFocusEffect, router } from "expo-router";
import Modal from "react-native-modal";

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: "Barbell",
  dumbbell: "Haltères",
  machine: "Machine",
  plate_loaded: "Charge plate",
  smith_machine: "Smith machine",
  cable: "Câble",
  kettlebell: "Kettlebell",
  band: "Bande élastique",
  none: "Sans équipement",
};

const MUSCLE_LABELS: Record<string, string> = {
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Avant-bras",
  front_delts: "Deltoïdes antérieurs",
  side_delts: "Deltoïdes latéraux",
  rear_delts: "Deltoïdes postérieurs",
  upper_chest: "Haut des pectoraux",
  middle_chest: "Pectoraux moyens",
  lower_chest: "Bas des pectoraux",
  lats: "Grand dorsal",
  rhomboids: "Rhomboïdes",
  traps: "Trapèzes",
  lower_back: "Bas du dos",
  upper_abs: "Abdominaux supérieurs",
  lower_abs: "Abdominaux inférieurs",
  obliques: "Obliques",
  glutes: "Fessiers",
  hip_flexors: "Fléchisseurs de hanche",
  abductors: "Abducteurs",
  adductors: "Adducteurs",
  quads: "Quadriceps",
  hamstrings: "Ischio-jambiers",
  calves: "Mollets",
  neck: "Cou",
  full_body: "Corps entier",
  cardio: "Cardio",
};

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  weight_reps: "Poids libres",
  bodyweight_reps: "Poids du corps",
  weighted_bodyweight: "Poids du corps lesté",
  assisted_bodyweight: "Poids du corps assisté",
  duration: "Durée",
  duration_weight: "Durée + poids",
  distance_duration: "Distance / durée",
  weight_distance: "Poids / distance",
};

const EQUIPMENT_FILTER_OPTIONS = [
  { key: "barbell", label: "Barbell" },
  { key: "dumbbell", label: "Haltères" },
  { key: "machine", label: "Machine" },
  { key: "plate_loaded", label: "Charge plate" },
  { key: "smith_machine", label: "Smith machine" },
  { key: "cable", label: "Câble" },
  { key: "kettlebell", label: "Kettlebell" },
  { key: "band", label: "Bande" },
  { key: "none", label: "Sans équipement" },
];

const MUSCLE_FILTER_OPTIONS = Object.entries(MUSCLE_LABELS).map(
  ([key, label]) => ({ key, label }),
);

const EXERCISE_TYPE_FILTER_OPTIONS = [
  { key: "weight_reps", label: "Poids + répétitions" },
  { key: "bodyweight_reps", label: "Poids du corps" },
  { key: "weighted_bodyweight", label: "Poids du corps lesté" },
  { key: "assisted_bodyweight", label: "Poids du corps assisté" },
  { key: "duration", label: "Durée" },
  { key: "duration_weight", label: "Durée + poids" },
  { key: "distance_duration", label: "Distance / durée" },
  { key: "weight_distance", label: "Poids / distance" },
];

export default function ExercisesScreen() {
  const { keyboardY, bottomOffset } = useKeyboardOffset();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [userCreatedIds, setUserCreatedIds] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(
    null,
  );
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadExercises = useCallback(async () => {
    try {
      setError(null);
      const [allExercises, createdIds] = await Promise.all([
        getAllExercises(),
        getUserCreatedExerciseIds(),
      ]);
      setExercises(allExercises);
      setFilteredExercises(allExercises);
      setUserCreatedIds(createdIds);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(message);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadExercises();
    }, [loadExercises]),
  );

  const applyExerciseFilters = (items: Exercise[]) =>
    items.filter((exercise) => {
      const matchesEquipment =
        !selectedEquipment || exercise.equipment_type === selectedEquipment;
      const matchesMuscle =
        !selectedMuscle || exercise.primary_muscle === selectedMuscle;
      const matchesExerciseType =
        !selectedExerciseType ||
        exercise.exercise_type === selectedExerciseType;

      return matchesEquipment && matchesMuscle && matchesExerciseType;
    });

  const handleSearchResults = (filteredNames: string[]) => {
    const baseFiltered = applyExerciseFilters(exercises);
    const filtered = baseFiltered.filter((e) => filteredNames.includes(e.name));
    setFilteredExercises(filtered);
  };

  const openFilterModal = () => setIsFilterModalVisible(true);

  const applyFilters = () => {
    setFilteredExercises(applyExerciseFilters(exercises));
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    setSelectedEquipment(null);
    setSelectedMuscle(null);
    setSelectedExerciseType(null);
    setFilteredExercises(exercises);
    setIsFilterModalVisible(false);
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    Alert.alert(
      "Supprimer l'exercice ?",
      `Voulez-vous vraiment retirer "${exercise.name}" de vos exercices ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await TokenService.get();
              if (!token) {
                Alert.alert("Erreur", "Authentification requise");
                return;
              }
              await deleteExercise(exercise.id, token);
              await loadExercises();
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : "Erreur lors de la suppression";
              Alert.alert("Erreur", message);
            }
          },
        },
      ],
    );
  };

  const userExercises = filteredExercises.filter((exercise) =>
    userCreatedIds.includes(exercise.id),
  );
  const sharedExercises = filteredExercises.filter(
    (exercise) => !userCreatedIds.includes(exercise.id),
  );
  const sections = [
    ...(userExercises.length > 0
      ? [
          {
            title: "Exercices créés par vous",
            items: userExercises,
            canDelete: true,
          },
        ]
      : []),
    ...(sharedExercises.length > 0
      ? [
          {
            title: "Exercices partagés",
            items: sharedExercises,
            canDelete: false,
          },
        ]
      : []),
  ];

  const renderExerciseCard = (item: Exercise, canDelete: boolean) => {
    return (
      <View className="mb-4 rounded-2xl border border-[#2A2A2A] bg-[#151515] p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-white">
              {item.name}
            </Text>
            <Text className="mt-1 text-xs uppercase tracking-[0.2em] text-[#9B8ACF]">
              {EXERCISE_TYPE_LABELS[item.exercise_type] ??
                item.exercise_type.replace(/_/g, " ")}
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <View className="rounded-full border border-[#7C5DB7] bg-[#241A36] px-3 py-1.5">
                <Text className="text-xs font-semibold text-[#D6C8FF]">
                  Muscle :{" "}
                  {MUSCLE_LABELS[item.primary_muscle] ??
                    item.primary_muscle.replace(/_/g, " ")}
                </Text>
              </View>
              <View className="rounded-full border border-gray-500 bg-[#2A2A2A] bg- px-3 py-1.5">
                <Text className="text-xs font-semibold text-gray-500">
                  Équipement :{" "}
                  {EQUIPMENT_LABELS[item.equipment_type] ??
                    item.equipment_type.replace(/_/g, " ")}
                </Text>
              </View>
            </View>
          </View>
          {canDelete && (
            <TouchableOpacity
              onPress={() => handleDeleteExercise(item)}
              className="rounded-full bg-[#2B1B33] p-3"
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#F5A0A0" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      className="h-full w-full bg-[#0F0F0F] px-4"
    >
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Chargement des exercices...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : filteredExercises.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Aucun exercice trouvé.</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          contentContainerStyle={{ paddingBottom: bottomOffset + 80 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="pb-3">
              <Text className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#B8B8B8]">
                {item.title}
              </Text>
              {item.items.map((exercise: Exercise) => (
                <View key={exercise.id}>
                  {renderExerciseCard(exercise, item.canDelete)}
                </View>
              ))}
            </View>
          )}
        />
      )}
      <Modal
        isVisible={isFilterModalVisible}
        onBackdropPress={() => setIsFilterModalVisible(false)}
        onSwipeComplete={() => setIsFilterModalVisible(false)}
        swipeDirection="down"
        propagateSwipe
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriverForBackdrop
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="rounded-t-3xl bg-[#121212] p-4 pb-6">
          <View className="mb-4 h-1.5 w-16 self-center rounded-full bg-[#3A3A3A]" />
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-semibold text-white">
              Filtrer les exercices
            </Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
              <Ionicons name="close" size={22} color="#B8B8B8" />
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            scrollEnabled
            className="max-h-[70%]"
          >
            <Text className="mb-2 text-sm font-semibold text-[#CFC6FF]">
              Équipement
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {EQUIPMENT_FILTER_OPTIONS.map((item) => {
                const active = selectedEquipment === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() =>
                      setSelectedEquipment(active ? null : item.key)
                    }
                    className={`rounded-full border px-3 py-2 ${active ? "border-[#7C5DB7] bg-[#241A36]" : "border-[#2F2F2F] bg-[#1A1A1A]"}`}
                  >
                    <Text
                      className={`text-sm ${active ? "text-[#E9E0FF]" : "text-[#B8B8B8]"}`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="mb-2 text-sm font-semibold text-[#CFC6FF]">
              Muscle principal
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {MUSCLE_FILTER_OPTIONS.map((item) => {
                const active = selectedMuscle === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setSelectedMuscle(active ? null : item.key)}
                    className={`rounded-full border px-3 py-2 ${active ? "border-[#7C5DB7] bg-[#241A36]" : "border-[#2F2F2F] bg-[#1A1A1A]"}`}
                  >
                    <Text
                      className={`text-sm ${active ? "text-[#E9E0FF]" : "text-[#B8B8B8]"}`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="mb-2 text-sm font-semibold text-[#CFC6FF]">
              Type d&apos;exercice
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {EXERCISE_TYPE_FILTER_OPTIONS.map((item) => {
                const active = selectedExerciseType === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() =>
                      setSelectedExerciseType(active ? null : item.key)
                    }
                    className={`rounded-full border px-3 py-2 ${active ? "border-[#7C5DB7] bg-[#241A36]" : "border-[#2F2F2F] bg-[#1A1A1A]"}`}
                  >
                    <Text
                      className={`text-sm ${active ? "text-[#E9E0FF]" : "text-[#B8B8B8]"}`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <View className="mt-3 flex-row gap-3">
            <TouchableOpacity
              onPress={resetFilters}
              className="flex-1 rounded-xl border border-[#2F2F2F] bg-[#1A1A1A] py-3"
            >
              <Text className="text-center text-sm font-semibold text-[#E5E5E5]">
                Réinitialiser
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyFilters}
              className="flex-1 rounded-xl bg-[#7C5DB7] py-3"
            >
              <Text className="text-center text-sm font-semibold text-white">
                Appliquer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Animated.View
        className="absolute left-0 right-0 px-4"
        style={{
          bottom: bottomOffset + 8,
          transform: [{ translateY: keyboardY }],
        }}
      >
        <GlassSearchBar
          items={exercises.map((e) => e.name)}
          onResults={handleSearchResults}
          onAdd={() => router.push("/(tabs)/workouts/createExercise")}
          placeholder="Rechercher un exercice…"
          filter={openFilterModal}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
