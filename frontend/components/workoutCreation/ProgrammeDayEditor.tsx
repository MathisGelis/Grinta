import React, { useCallback, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { PlannedWorkout } from "@/services/workouts.service";

export interface ProgrammeDayEditorItem {
  id: string;
  dayNumber: number;
  workoutId?: string;
  title?: string;
}

interface ProgrammeDayEditorProps {
  days: ProgrammeDayEditorItem[];
  onChangeDays: (days: ProgrammeDayEditorItem[]) => void;
  availableWorkouts: PlannedWorkout[];
}

export default function ProgrammeDayEditor({
  days,
  onChangeDays,
  availableWorkouts,
}: ProgrammeDayEditorProps) {
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);

  const addWorkoutDay = useCallback(
    (workout: PlannedWorkout) => {
      onChangeDays([
        ...days,
        {
          id: `${workout.id}-${Date.now()}`,
          dayNumber: days.length + 1,
          workoutId: workout.id,
          title: workout.title,
        },
      ]);
      setShowWorkoutPicker(false);
    },
    [days, onChangeDays],
  );

  const addRestDay = useCallback(() => {
    onChangeDays([
      ...days,
      {
        id: `rest-${Date.now()}`,
        dayNumber: days.length + 1,
        workoutId: "",
        title: "Jour de repos",
      },
    ]);
  }, [days, onChangeDays]);

  const removeDay = useCallback(
    (id: string) => {
      onChangeDays(
        days
          .filter((item) => item.id !== id)
          .map((item, index) => ({ ...item, dayNumber: index + 1 })),
      );
    },
    [days, onChangeDays],
  );

  const renderDayItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ProgrammeDayEditorItem>) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={drag}
      style={{
        backgroundColor: isActive ? "#1F2937" : "#171717",
        borderColor: isActive ? "#8B5CF6" : "#2A2A2A",
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
            marginRight: 8,
            gap: 10,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: "#252525",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="reorder-three-outline" size={18} color="#E5E7EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#F5F5F5", fontSize: 16, fontWeight: "700" }}>
              Jour {item.dayNumber} · {item.title || "Jour de repos"}
            </Text>
            <Text style={{ color: "#A3A3A3", fontSize: 12, marginTop: 2 }}>
              {item.workoutId ? "Séance programmée" : "Jour de repos"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => removeDay(item.id)}
          style={{ padding: 8, alignItems: "center", justifyContent: "center" }}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-[#B8B8B8]">
          Jours du programme
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setShowWorkoutPicker(true)}
            className="rounded-full bg-[#232323] px-3 py-2"
          >
            <Text className="text-sm font-semibold text-white">+ Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={addRestDay}
            className="rounded-full bg-[#232323] px-3 py-2"
          >
            <Text className="text-sm font-semibold text-white">+ Rest day</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-4 rounded-2xl border border-[#2F2F2F] bg-[#111111] p-3">
        {days.length === 0 ? (
          <View className="items-center py-6">
            <Ionicons name="calendar-outline" size={36} color="#A3A3A3" />
            <Text className="mt-2 text-sm text-[#C7C7C7]">
              Aucun jour ajouté pour l&apos;instant.
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={days}
            keyExtractor={(item) => item.id}
            onDragEnd={({ data }) =>
              onChangeDays(
                data.map((item, index) => ({ ...item, dayNumber: index + 1 })),
              )
            }
            renderItem={renderDayItem}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </View>

      <Modal
        visible={showWorkoutPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWorkoutPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-[#111111] p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-white">
                Choisir une séance
              </Text>
              <TouchableOpacity onPress={() => setShowWorkoutPicker(false)}>
                <Ionicons name="close" size={24} color="#E5E7EB" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
            >
              {availableWorkouts.length === 0 ? (
                <View className="items-center py-6">
                  <Text className="text-sm text-[#C7C7C7]">
                    Aucune séance disponible.
                  </Text>
                  <Text className="mt-1 text-xs text-[#A3A3A3]">
                    Créez d’abord une séance dans l’onglet séances.
                  </Text>
                </View>
              ) : (
                availableWorkouts.map((workout) => (
                  <TouchableOpacity
                    key={workout.id}
                    onPress={() => addWorkoutDay(workout)}
                    className="mb-3 rounded-2xl border border-[#2F2F2F] bg-[#171717] p-4"
                  >
                    <Text className="text-base font-semibold text-white">
                      {workout.title}
                    </Text>
                    <Text className="mt-1 text-xs text-[#A3A3A3]">
                      {workout.description || "Aucune description"}
                    </Text>
                    <Text className="mt-2 text-[11px] text-[#C4B5FD]">
                      {workout.totalExercises} exercice(s)
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
