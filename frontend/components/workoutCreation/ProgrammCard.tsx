import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TokenService } from "@/services/token.service";
import {
  getPlannedWorkouts,
  PlannedWorkout,
} from "@/services/workouts.service";
import {
  getProgrammeById,
  SmallProgramm,
  updateProgramme,
  deleteProgramme,
  Programm,
  ProgrammeDay,
} from "@/services/programms.service";
import ProgrammeDayEditor from "@/components/workoutCreation/ProgrammeDayEditor";

interface ProgrammCardProps {
  program: SmallProgramm;
  onUpdate?: (updated: SmallProgramm) => void;
  onDelete?: (id: string) => void;
}

export default function ProgrammCard({
  program,
  onUpdate,
  onDelete,
}: ProgrammCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<PlannedWorkout[]>(
    [],
  );
  const [days, setDays] = useState<ProgrammeDay[]>([]);
  const [saving, setSaving] = useState(false);
  const [fullProgram, setFullProgram] = useState<Programm | null>(null);

  const handleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    try {
      setLoading(true);

      const [fetchedProgram, workouts] = await Promise.all([
        getProgrammeById(program.id),
        TokenService.get().then((token) =>
          getPlannedWorkouts(token || undefined),
        ),
      ]);

      setFullProgram(fetchedProgram); // ← stocker
      setDays(
        (fetchedProgram.days ?? []).map((day, index) => ({
          dayNumber: index + 1,
          workout: day.workout ?? null,
        })),
      );

      setAvailableWorkouts(workouts);
      setIsExpanded(true);
    } catch (error) {
      console.error("Erreur chargement programme", error);
      Alert.alert("Erreur", "Impossible de charger le programme.");
    } finally {
      setLoading(false);
    }
  }, [isExpanded, program.id]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      console.log(
        "Données à sauvegarder:",
        JSON.stringify(
          {
            id: program.id,
            weekNumber: fullProgram?.weekNumber ?? 1,
            difficulty: fullProgram?.difficulty ?? "BEGINNER",
            locationType: fullProgram?.locationType ?? "ANY",
            title: fullProgram?.title ?? program.title,
            description: fullProgram?.description,
            totalWorkoutDays: days.length,
            days: days.map((day) => ({
              dayNumber: day.dayNumber,
              workoutId: day.workout?.id ?? null,
            })),
          },
          null,
          2,
        ),
      );
      const updated = await updateProgramme(program.id, {
        weekNumber: fullProgram?.weekNumber ?? 1,
        difficulty: fullProgram?.difficulty ?? "BEGINNER",
        locationType: fullProgram?.locationType ?? "ANY",
        title: fullProgram?.title ?? program.title,
        description: fullProgram?.description,
        days: days.map((day) => ({
          dayNumber: day.dayNumber,
          workoutId: day.workout?.id ?? null,
        })),
      });

      // Merger updated (Programm) dans SmallProgramm
      if (onUpdate) onUpdate({ ...program, ...updated });
      Alert.alert("Succès", "Le programme a été mis à jour.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      Alert.alert("Erreur", message);
    } finally {
      setSaving(false);
    }
  }, [days, onUpdate, program, fullProgram]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce programme ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProgramme(program.id);
              onDelete?.(program.id); // ← propre, pas de hack deleted: true
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le programme.");
              console.error("Erreur suppression programme", error);
            }
          },
        },
      ],
    );
  }, [onDelete, program.id]);

  return (
    <View className="mb-4 rounded-2xl border border-[#2F2F2F] bg-[#171717] p-4">
      <TouchableOpacity
        onPress={handleExpand}
        disabled={loading}
        className="flex flex-col"
      >
        <View className="flex-row items-start justify-between gap-3">
          <Text className="text-lg font-bold text-white">{program.title}</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#E5E7EB"
            />
          )}
        </View>
        <View className="mt-3 flex-row gap-2">
          <View className="rounded-full bg-[#232323] px-3 py-1">
            <Text className="text-xs text-[#E5E7EB]">
              Difficulté: {program.difficulty}
            </Text>
          </View>
          <View className="rounded-full bg-[#232323] px-3 py-1">
            <Text className="text-xs text-[#E5E7EB]">
              {program.totalDays} jours(s)
            </Text>
          </View>
          <View className="rounded-full bg-[#232323] px-3 py-1">
            <Text className="text-xs text-[#E5E7EB]">
              {program.workoutDays} séance(s)
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-4 rounded-2xl border border-[#2F2F2F] bg-[#111111] p-3">
          <ProgrammeDayEditor
            days={days}
            onChangeDays={setDays}
            availableWorkouts={availableWorkouts}
          />

          <View className="flex-row items-center justify-center w-full gap-2">
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="rounded-2xl bg-[#8B5CF6] px-4 py-3 flex-1"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-center text-sm font-semibold text-white">
                  Enregistrer les jours
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="rounded-2xl bg-[#fe4848] px-4 py-3"
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
