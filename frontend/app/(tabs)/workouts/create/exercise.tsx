import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  createExercise,
  EQUIPMENT_LABELS,
  MUSCLE_LABELS,
  EXERCISE_TYPE_LABELS,
} from "@/services/exercises.service";
import { TokenService } from "@/services/token.service";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SelectList,
  MultipleSelectList,
} from "react-native-dropdown-select-list";

const sharedBoxStyles = {
  backgroundColor: "#1A1A1A",
  borderColor: "#333333",
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
};

const sharedDropdownStyles = {
  backgroundColor: "#1A1A1A",
  borderColor: "#333333",
  borderRadius: 8,
};

const sharedDropdownItemStyles = {
  backgroundColor: "#1A1A1A",
  borderBottomColor: "#333333",
};

export default function CreateExerciseScreen() {
  const [name, setName] = useState("");
  const [equipmentType, setEquipmentType] = useState<string | null>(null);
  const [primaryMuscle, setPrimaryMuscle] = useState<string | null>(null);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [exerciseType, setExerciseType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateExercise = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Erreur", "Le nom de l'exercice est requis");
      return;
    }
    if (!equipmentType) {
      Alert.alert("Erreur", "Le type d'équipement est requis");
      return;
    }
    if (!primaryMuscle) {
      Alert.alert("Erreur", "Le muscle primaire est requis");
      return;
    }
    if (!exerciseType) {
      Alert.alert("Erreur", "Le type d'exercice est requis");
      return;
    }

    setLoading(true);
    try {
      const token = await TokenService.get();
      if (!token) {
        Alert.alert("Erreur", "Authentification requise");
        return;
      }

      const exerciseData = {
        name: name.trim(),
        equipment_type: equipmentType,
        primary_muscle: primaryMuscle,
        secondary_muscles:
          secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
        exercise_type: exerciseType,
      };

      await createExercise(exerciseData, token);
      Alert.alert("Succès", "Exercice créé avec succès", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la création";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F0F]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 py-6">
          {/* Name Input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
              Nom <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              placeholder="Ex: Barbell Bench Press"
              placeholderTextColor="#808080"
              value={name}
              onChangeText={setName}
              className="rounded-lg border border-[#333333] bg-[#1A1A1A] px-3 py-2.5 text-white"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
              Type d&apos;équipement <Text className="text-red-500">*</Text>
            </Text>
            <SelectList
              setSelected={(val: string) => setEquipmentType(val)}
              data={Object.entries(EQUIPMENT_LABELS).map(([key, label]) => ({
                key,
                value: label,
              }))}
              save="key"
              search={false}
              placeholder="Sélectionnez un équipement"
              inputStyles={{ color: "#FFFFFF" }}
              boxStyles={sharedBoxStyles}
              dropdownStyles={sharedDropdownStyles}
              dropdownItemStyles={sharedDropdownItemStyles}
              dropdownTextStyles={{ color: "#FFFFFF" }}
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
              Muscle primaire <Text className="text-red-500">*</Text>
            </Text>
            <SelectList
              setSelected={(val: string) => setPrimaryMuscle(val)}
              data={Object.entries(MUSCLE_LABELS).map(([key, label]) => ({
                key,
                value: label,
              }))}
              save="key"
              search={false}
              placeholder="Sélectionnez un muscle"
              inputStyles={{ color: "#FFFFFF" }}
              boxStyles={sharedBoxStyles}
              dropdownStyles={sharedDropdownStyles}
              dropdownItemStyles={sharedDropdownItemStyles}
              dropdownTextStyles={{ color: "#FFFFFF" }}
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
              Muscles secondaires
            </Text>
            <MultipleSelectList
              setSelected={setSecondaryMuscles}
              data={Object.entries(MUSCLE_LABELS).map(([key, label]) => ({
                key,
                value: label,
              }))}
              save="key"
              search={false}
              placeholder="Sélectionnez des muscles"
              label="Sélectionnés"
              inputStyles={{ color: "#FFFFFF" }}
              boxStyles={sharedBoxStyles}
              dropdownStyles={sharedDropdownStyles}
              dropdownItemStyles={sharedDropdownItemStyles}
              dropdownTextStyles={{ color: "#FFFFFF" }}
              badgeStyles={{ backgroundColor: "#7C5DB7" }}
              labelStyles={{ color: "#B8B8B8" }}
              checkBoxStyles={{ borderColor: "#333333" }}
              disabledCheckBoxStyles={{ borderColor: "#555555" }}
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-[#B8B8B8]">
              Type d&apos;exercice <Text className="text-red-500">*</Text>
            </Text>
            <SelectList
              setSelected={(val: string) => setExerciseType(val)}
              data={Object.entries(EXERCISE_TYPE_LABELS).map(
                ([key, label]) => ({ key, value: label }),
              )}
              save="key"
              search={false}
              placeholder="Sélectionnez un type"
              inputStyles={{ color: "#FFFFFF" }}
              boxStyles={sharedBoxStyles}
              dropdownStyles={sharedDropdownStyles}
              dropdownItemStyles={sharedDropdownItemStyles}
              dropdownTextStyles={{ color: "#FFFFFF" }}
            />
          </View>

          {/* Action Buttons */}
          <View className="mt-8 flex-row gap-3">
            <TouchableOpacity
              onPress={handleCreateExercise}
              disabled={loading}
              className="flex-1 rounded-lg bg-[#7C5DB7] py-4"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center font-semibold text-white">
                  Créer l&apos;exercice
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
