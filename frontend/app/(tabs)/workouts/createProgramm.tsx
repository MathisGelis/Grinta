import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SelectList } from "react-native-dropdown-select-list";
import ProgrammeDayEditor from "@/components/workout/ProgrammeDayEditor";
import { TokenService } from "@/services/token.service";
import { createProgramme } from "@/services/programms.service";
import {
  getPlannedWorkouts,
  getWorkoutById,
  PlannedWorkout,
} from "@/services/workouts.service";

interface ProgrammeDayItem {
  id: string;
  dayNumber: number;
  workoutId: string;
  title: string;
}

const DIFFICULTY_OPTIONS = [
  { key: "BEGINNER", value: "Débutant" },
  { key: "INTERMEDIATE", value: "Intermédiaire" },
  { key: "ADVANCED", value: "Avancé" },
];

const LOCATION_OPTIONS = [
  { key: "GYM", value: "Salle de sport" },
  { key: "HOME", value: "Domicile" },
  { key: "OUTDOORS", value: "Extérieur" },
  { key: "ANY", value: "Tous lieux" },
];

export default function CreateProgrammScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [locationType, setLocationType] = useState("GYM");
  const [days, setDays] = useState<ProgrammeDayItem[]>([]);
  const [availableWorkouts, setAvailableWorkouts] = useState<PlannedWorkout[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const loadWorkouts = useCallback(async () => {
    try {
      const token = await TokenService.get();
      const plannedWorkouts = await getPlannedWorkouts(token || undefined);

      const enrichedWorkouts = await Promise.all(
        plannedWorkouts.map(async (workout) => {
          try {
            const detail = await getWorkoutById(workout.id, token || undefined);
            return {
              id: detail.id,
              title: detail.title,
              description: detail.description,
              totalExercises: detail.totalExercises,
            };
          } catch (error) {
            console.warn("Fallback workout id used", error);
            return workout;
          }
        }),
      );

      setAvailableWorkouts(enrichedWorkouts);
    } catch (error) {
      console.error("Erreur chargement workouts", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  const submitProgramme = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Erreur", "Le titre du programme est requis.");
      return;
    }

    if (days.length === 0) {
      Alert.alert("Erreur", "Ajoutez au moins un jour au programme.");
      return;
    }

    setLoading(true);

    try {
      const token = await TokenService.get();
      await createProgramme(
        {
          weekNumber: 1,
          difficulty,
          locationType,
          title: title.trim(),
          description: description.trim() || undefined,
          days: days.map((day, index) => ({
            dayNumber: index + 1,
            workoutId: day.workoutId ?? "",
          })),
        },
        token || undefined,
      );

      Alert.alert("Succès", "Programme créé avec succès", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la création";
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  }, [days, description, difficulty, locationType, title]);

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F0F]">
      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-2 text-2xl font-bold text-white">
          Créer un programme
        </Text>
        <Text className="mb-4 text-sm text-[#C7C7C7]">
          Définis le titre, la difficulté, le lieu et l’ordre des jours de ton
          programme.
        </Text>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
            Titre *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Programme force 4 semaines"
            placeholderTextColor="#808080"
            className="rounded-xl border border-[#2F2F2F] bg-[#171717] px-3 py-3 text-white"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Objectif, fréquence, notes…"
            placeholderTextColor="#808080"
            className="rounded-xl border border-[#2F2F2F] bg-[#171717] px-3 py-3 text-white"
            style={{ minHeight: 90, textAlignVertical: "top" }}
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
            Difficulté *
          </Text>
          <SelectList
            setSelected={(value: string) => setDifficulty(value)}
            data={DIFFICULTY_OPTIONS}
            save="key"
            search={false}
            placeholder="Choisir une difficulté"
            defaultOption={DIFFICULTY_OPTIONS.find(
              (option) => option.key === difficulty,
            )}
            inputStyles={{ color: "#FFFFFF" }}
            boxStyles={{
              backgroundColor: "#171717",
              borderColor: "#2F2F2F",
              borderRadius: 12,
            }}
            dropdownStyles={{
              backgroundColor: "#171717",
              borderColor: "#2F2F2F",
              borderRadius: 12,
            }}
            dropdownItemStyles={{
              backgroundColor: "#171717",
              borderBottomColor: "#2F2F2F",
            }}
            dropdownTextStyles={{ color: "#FFFFFF" }}
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
            Lieu *
          </Text>
          <SelectList
            setSelected={(value: string) => setLocationType(value)}
            data={LOCATION_OPTIONS}
            save="key"
            search={false}
            placeholder="Choisir un lieu"
            defaultOption={LOCATION_OPTIONS.find(
              (option) => option.key === locationType,
            )}
            inputStyles={{ color: "#FFFFFF" }}
            boxStyles={{
              backgroundColor: "#171717",
              borderColor: "#2F2F2F",
              borderRadius: 12,
            }}
            dropdownStyles={{
              backgroundColor: "#171717",
              borderColor: "#2F2F2F",
              borderRadius: 12,
            }}
            dropdownItemStyles={{
              backgroundColor: "#171717",
              borderBottomColor: "#2F2F2F",
            }}
            dropdownTextStyles={{ color: "#FFFFFF" }}
          />
        </View>

        <ProgrammeDayEditor
          days={days}
          onChangeDays={setDays}
          availableWorkouts={availableWorkouts}
        />

        <TouchableOpacity
          onPress={submitProgramme}
          disabled={loading}
          className="mt-2 rounded-2xl bg-[#8B5CF6] px-4 py-3"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">
              Créer le programme
            </Text>
          )}
        </TouchableOpacity>

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
