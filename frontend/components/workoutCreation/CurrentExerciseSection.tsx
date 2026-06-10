import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

export interface CompletedSet {
  reps: number;
  weight: number;
}

interface CurrentExerciseSectionProps {
  exerciseName: string;
  currentSetIndex: number;
  totalSets: number;
  plannedSetData: CompletedSet[];
  completedSets: CompletedSet[];
  onCompleteSet: (reps: number, weight: number) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onSkipExercise: () => void;
  onDeleteExercise?: () => void;
  isLastExercise: boolean;
  isLastSet: boolean;
}

export default function CurrentExerciseSection({
  exerciseName,
  currentSetIndex,
  totalSets,
  plannedSetData,
  completedSets,
  onCompleteSet,
  onAddSet,
  onRemoveSet,
  onSkipExercise,
  onDeleteExercise,
  isLastExercise,
  isLastSet,
}: CurrentExerciseSectionProps) {
  const [weight, setWeight] = useState(
    plannedSetData[currentSetIndex]?.weight.toString() || "0",
  );
  const [reps, setReps] = useState(
    plannedSetData[currentSetIndex]?.reps.toString() || "0",
  );

  // Update weight and reps when currentSetIndex changes
  useEffect(() => {
    setWeight(plannedSetData[currentSetIndex]?.weight.toString() || "0");
    setReps(plannedSetData[currentSetIndex]?.reps.toString() || "0");
  }, [currentSetIndex, plannedSetData]);

  const handleCompleteSet = () => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    onCompleteSet(r, w);
  };

  const handleDeleteExercise = () => {
    Alert.alert(
      "Supprimer l'exercice",
      `Êtes-vous sûr de vouloir supprimer "${exerciseName}" de la séance?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          onPress: () => onDeleteExercise?.(),
          style: "destructive",
        },
      ],
    );
  };

  return (
    <View
      style={{
        backgroundColor: WorkoutTheme.backgroundTertiary,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 16,
        borderWidth: 1,
        borderColor: WorkoutTheme.border,
      }}
    >
      {/* Exercise Name */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: WorkoutTheme.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Exercice en cours
        </Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: WorkoutTheme.text.primary,
            textAlign: "center",
          }}
        >
          {exerciseName}
        </Text>
      </View>

      {/* Weight and Reps Display */}
      <View
        style={{
          backgroundColor: WorkoutTheme.accent.purple + "15",
          borderRadius: 12,
          paddingVertical: 20,
          paddingHorizontal: 16,
          marginBottom: 20,
          borderWidth: 2,
          borderColor: WorkoutTheme.accent.purple,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          {/* Weight Input */}
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: WorkoutTheme.text.secondary,
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Poids
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: WorkoutTheme.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: WorkoutTheme.border,
                paddingHorizontal: 8,
              }}
            >
              <TextInput
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: WorkoutTheme.accent.purple,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  width: 60,
                  textAlign: "center",
                }}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                maxLength={5}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: WorkoutTheme.text.secondary,
                }}
              >
                kg
              </Text>
            </View>
          </View>

          {/* Separator */}
          <View
            style={{
              width: 1,
              height: 60,
              backgroundColor: WorkoutTheme.border,
              marginHorizontal: 16,
            }}
          />

          {/* Reps Input */}
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: WorkoutTheme.text.secondary,
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Répétitions
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: WorkoutTheme.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: WorkoutTheme.border,
                paddingHorizontal: 8,
              }}
            >
              <TextInput
                style={{
                  fontSize: 24,
                  fontWeight: "700",
                  color: WorkoutTheme.status.success,
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  width: 60,
                  textAlign: "center",
                }}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: WorkoutTheme.text.secondary,
                }}
              >
                reps
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Series Progress Bar */}
      <View style={{ marginBottom: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: WorkoutTheme.text.secondary,
              textTransform: "uppercase",
            }}
          >
            Série {currentSetIndex + 1} / {totalSets}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={onAddSet}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: WorkoutTheme.accent.purple,
                borderRadius: 6,
              }}
            >
              <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRemoveSet}
              disabled={totalSets <= 1}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor:
                  totalSets <= 1
                    ? WorkoutTheme.border
                    : WorkoutTheme.status.danger,
                borderRadius: 6,
                opacity: totalSets <= 1 ? 0.5 : 1,
              }}
            >
              <Ionicons name="remove" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bars */}
        <View
          style={{
            flexDirection: "row",
            gap: 6,
            backgroundColor: WorkoutTheme.background,
            borderRadius: 8,
            padding: 8,
          }}
        >
          {Array.from({ length: totalSets }).map((_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 8,
                backgroundColor:
                  index < currentSetIndex
                    ? WorkoutTheme.status.success
                    : index === currentSetIndex
                      ? WorkoutTheme.accent.purple
                      : WorkoutTheme.border,
                borderRadius: 4,
              }}
            />
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 10 }}>
        {/* Complete Set Button */}
        <TouchableOpacity
          onPress={handleCompleteSet}
          style={{
            backgroundColor: WorkoutTheme.accent.purple,
            borderRadius: 10,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name="checkmark" size={18} color="white" />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "white",
            }}
          >
            {isLastSet && isLastExercise
              ? "Terminer la séance"
              : isLastSet
                ? "Exercice suivant"
                : "Série suivante"}
          </Text>
        </TouchableOpacity>

        {/* Skip Exercise Button */}
        <TouchableOpacity
          onPress={onSkipExercise}
          style={{
            backgroundColor: WorkoutTheme.backgroundSecondary,
            borderRadius: 10,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: WorkoutTheme.border,
          }}
        >
          <Ionicons
            name="arrow-forward"
            size={16}
            color={WorkoutTheme.text.secondary}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: WorkoutTheme.text.secondary,
            }}
          >
            Passer l&apos;exercice
          </Text>
        </TouchableOpacity>

        {/* Delete Exercise Button */}
        {onDeleteExercise && (
          <TouchableOpacity
            onPress={handleDeleteExercise}
            style={{
              backgroundColor: WorkoutTheme.status.danger + "20",
              borderRadius: 10,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: WorkoutTheme.status.danger,
            }}
          >
            <Ionicons
              name="trash"
              size={16}
              color={WorkoutTheme.status.danger}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: WorkoutTheme.status.danger,
              }}
            >
              Supprimer l&apos;exercice
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
