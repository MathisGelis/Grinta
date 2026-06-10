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
} from "@/services/programms.service";
import ProgrammeDayEditor, {
  ProgrammeDayEditorItem,
} from "@/components/workoutCreation/ProgrammeDayEditor";

interface ProgrammCardProps {
  program: SmallProgramm;
  onUpdate?: (updated: SmallProgramm) => void;
}

export default function ProgrammCard({ program, onUpdate }: ProgrammCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<PlannedWorkout[]>(
    [],
  );
  const [days, setDays] = useState<ProgrammeDayEditorItem[]>([]);
  const [saving, setSaving] = useState(false);

  const handleExpand = useCallback(async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch en parallèle : détails du programme + workouts disponibles
      const [fullProgram, workouts] = await Promise.all([
        getProgrammeById(program.id),
        TokenService.get().then((token) =>
          getPlannedWorkouts(token || undefined),
        ),
      ]);

      // Hydrater les jours avec les données complètes
      setDays(
        (fullProgram.days ?? []).map((day, index) => ({
          id: day.workoutId ? day.workoutId : `rest-${day.dayNumber}-${index}`,
          dayNumber: index + 1,
          workoutId: day.workoutId ?? "",
          title: day.workout?.title ?? "Jour de repos",
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
      const updated = await updateProgramme(program.id, {
        weekNumber: program.weekNumber || 1,
        difficulty: program.difficulty || "BEGINNER",
        locationType: program.locationType || "ANY",
        title: program.title,
        description: program.description,
        days: days.map((day, index) => ({
          dayNumber: index + 1,
          workoutId: day.workoutId || "",
        })),
      });

      if (onUpdate) onUpdate(updated);
      Alert.alert("Succès", "Le programme a été mis à jour.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      Alert.alert("Erreur", message);
    } finally {
      setSaving(false);
    }
  }, [days, onUpdate, program]);

  return (
    <View className="mb-4 rounded-2xl border border-[#2F2F2F] bg-[#171717] p-4">
      <TouchableOpacity onPress={handleExpand} disabled={loading}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">
              {program.title}
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-[#232323] px-3 py-1">
                <Text className="text-xs text-[#E5E7EB]">
                  Difficulté: {program.difficulty}
                </Text>
              </View>
              <View className="rounded-full bg-[#232323] px-3 py-1">
                <Text className="text-xs text-[#E5E7EB]">
                  {program.weekNumber} semaine(s)
                </Text>
              </View>
            </View>
          </View>
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
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-4 rounded-2xl border border-[#2F2F2F] bg-[#111111] p-3">
          <ProgrammeDayEditor
            days={days}
            onChangeDays={setDays}
            availableWorkouts={availableWorkouts}
          />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="mt-2 rounded-2xl bg-[#8B5CF6] px-4 py-3"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center text-sm font-semibold text-white">
                Enregistrer les jours
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
