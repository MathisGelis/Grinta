import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TokenService } from "@/services/token.service";
import { getPlannedWorkouts, PlannedWorkout } from "@/services/workouts.service";
import { Programm, updateProgramme } from "@/services/programms.service";
import ProgrammeDayEditor, {
  ProgrammeDayEditorItem,
} from "@/components/workout/ProgrammeDayEditor";

interface ProgrammCardProps {
  program: Programm;
  onUpdate?: (updated: Programm) => void;
}

export default function ProgrammCard({ program, onUpdate }: ProgrammCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<PlannedWorkout[]>([]);
  const [days, setDays] = useState<ProgrammeDayEditorItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (program.days) {
      setDays(
        program.days.map((day, index) => ({
          id: day.workoutId || `rest-${day.dayNumber}`,
          dayNumber: index + 1,
          workoutId: day.workoutId || "",
          title: day.workout?.title || "Jour de repos",
        })),
      );
    }
  }, [program]);

  const loadAvailableWorkouts = useCallback(async () => {
    try {
      const token = await TokenService.get();
      const workouts = await getPlannedWorkouts(token || undefined);
      setAvailableWorkouts(workouts);
    } catch (error) {
      console.error("Erreur chargement workouts pour programme", error);
    }
  }, []);

  useEffect(() => {
    if (isExpanded) {
      loadAvailableWorkouts();
    }
  }, [isExpanded, loadAvailableWorkouts]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const token = await TokenService.get();
      const updated = await updateProgramme(
        program.id,
        {
          weekNumber: program.weekNumber || 1,
          difficulty: program.difficulty || "BEGINNER",
          locationType: program.locationType || "ANY",
          title: program.title,
          description: program.description,
          days: days.map((day, index) => ({
            dayNumber: index + 1,
            workoutId: day.workoutId || "",
          })),
        },
        token || undefined,
      );

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

  const daysCount = useMemo(() => program.days?.length || days.length || 0, [days.length, program.days]);

  return (
    <View className="mb-4 rounded-2xl border border-[#2F2F2F] bg-[#171717] p-4">
      <TouchableOpacity onPress={() => setIsExpanded((prev) => !prev)}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">{program.title}</Text>
            <Text className="mt-1 text-sm text-[#C7C7C7]">{program.description || "Aucune description"}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-[#232323] px-3 py-1">
                <Text className="text-xs text-[#E5E7EB]">Difficulté: {program.difficulty}</Text>
              </View>
              <View className="rounded-full bg-[#232323] px-3 py-1">
                <Text className="text-xs text-[#E5E7EB]">Lieu: {program.locationType}</Text>
              </View>
              <View className="rounded-full bg-[#232323] px-3 py-1">
                <Text className="text-xs text-[#E5E7EB]">{daysCount} jour(s)</Text>
              </View>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#E5E7EB"
          />
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
              <Text className="text-center text-sm font-semibold text-white">Enregistrer les jours</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
