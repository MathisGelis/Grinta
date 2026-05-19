import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  WorkoutService,
  ExerciseDetail,
  CreateSetDto,
} from "@/services/workout.service";

interface SelectedExercise {
  exercise: ExerciseDetail;
  sets: CreateSetDto[];
  plannedRestSeconds: number;
}

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [saving, setSaving] = useState(false);

  // Exercise picker
  const [pickerVisible, setPickerVisible] = useState(false);
  const [allExercises, setAllExercises] = useState<ExerciseDetail[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sets editor
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const loadExercises = useCallback(async () => {
    setLoadingExercises(true);
    try {
      const data = await WorkoutService.getExercises();
      setAllExercises(data);
    } catch {
      setAllExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const filteredExercises = allExercises.filter((ex) => {
    if (!searchQuery.trim()) return true;
    return ex.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const alreadySelectedIds = new Set(selectedExercises.map((s) => s.exercise.id));

  function addExercise(exercise: ExerciseDetail) {
    setSelectedExercises((prev) => [
      ...prev,
      { exercise, sets: [{ reps: 10, weight: 0 }], plannedRestSeconds: 60 },
    ]);
    setPickerVisible(false);
    setSearchQuery("");
  }

  function removeExercise(index: number) {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }

  function addSet(exIndex: number) {
    setSelectedExercises((prev) => {
      const copy = [...prev];
      const lastSet = copy[exIndex].sets[copy[exIndex].sets.length - 1];
      copy[exIndex] = {
        ...copy[exIndex],
        sets: [...copy[exIndex].sets, { reps: lastSet?.reps ?? 10, weight: lastSet?.weight ?? 0 }],
      };
      return copy;
    });
  }

  function removeSet(exIndex: number, setIndex: number) {
    setSelectedExercises((prev) => {
      const copy = [...prev];
      if (copy[exIndex].sets.length <= 1) return prev;
      copy[exIndex] = {
        ...copy[exIndex],
        sets: copy[exIndex].sets.filter((_, i) => i !== setIndex),
      };
      return copy;
    });
  }

  function updateSet(exIndex: number, setIndex: number, field: "reps" | "weight", value: string) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setSelectedExercises((prev) => {
      const copy = [...prev];
      const sets = [...copy[exIndex].sets];
      sets[setIndex] = { ...sets[setIndex], [field]: num };
      copy[exIndex] = { ...copy[exIndex], sets };
      return copy;
    });
  }

  function moveExercise(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;
    setSelectedExercises((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
    if (editingIndex === index) setEditingIndex(newIndex);
    else if (editingIndex === newIndex) setEditingIndex(index);
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert(t.error, "Title is required");
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert(t.error, "Add at least one exercise");
      return;
    }

    setSaving(true);
    try {
      await WorkoutService.createPlanned({
        title: title.trim(),
        description: description.trim() || undefined,
        exercises: selectedExercises.map((se) => ({
          exerciseId: se.exercise.id,
          sets: se.sets.length > 0 ? se.sets : undefined,
          plannedRestSeconds: se.plannedRestSeconds || undefined,
        })),
      });
      router.back();
    } catch (err: any) {
      Alert.alert(t.error, err.message || "Failed to create workout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.newWorkouts}</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerBtn, styles.saveBtnWrap]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveText}>{t.saveChanges}</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title & Description */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.titleInput}
              placeholder="Workout name"
              placeholderTextColor="#555"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.descInput}
              placeholder="Description (optional)"
              placeholderTextColor="#444"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Exercise list */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Exercises ({selectedExercises.length})
            </Text>
          </View>

          {selectedExercises.map((se, exIdx) => (
            <View key={se.exercise.id} style={styles.exerciseItem}>
              {/* Exercise header row */}
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIndex}>
                  <Text style={styles.exerciseIndexText}>{exIdx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{se.exercise.name}</Text>
                  {se.exercise.equipment_type !== "none" && (
                    <Text style={styles.exerciseEquip}>
                      {se.exercise.equipment_type.replace(/_/g, " ")}
                    </Text>
                  )}
                </View>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity
                    onPress={() => moveExercise(exIdx, -1)}
                    style={styles.smallBtn}
                  >
                    <Ionicons name="arrow-up" size={16} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveExercise(exIdx, 1)}
                    style={styles.smallBtn}
                  >
                    <Ionicons name="arrow-down" size={16} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      setEditingIndex(editingIndex === exIdx ? null : exIdx)
                    }
                    style={styles.smallBtn}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={editingIndex === exIdx ? "#7B5CF0" : "#666"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeExercise(exIdx)}
                    style={styles.smallBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sets summary or editor */}
              {editingIndex === exIdx ? (
                <View style={styles.setsEditor}>
                  {/* Column headers */}
                  <View style={styles.setHeaderRow}>
                    <Text style={styles.setHeaderText}>Set</Text>
                    <Text style={styles.setHeaderText}>Reps</Text>
                    <Text style={styles.setHeaderText}>Kg</Text>
                    <View style={{ width: 28 }} />
                  </View>
                  {se.sets.map((s, sIdx) => (
                    <View key={sIdx} style={styles.setRow}>
                      <Text style={styles.setNum}>{sIdx + 1}</Text>
                      <TextInput
                        style={styles.setInput}
                        keyboardType="number-pad"
                        value={String(s.reps)}
                        onChangeText={(v) => updateSet(exIdx, sIdx, "reps", v)}
                      />
                      <TextInput
                        style={styles.setInput}
                        keyboardType="number-pad"
                        value={String(s.weight)}
                        onChangeText={(v) => updateSet(exIdx, sIdx, "weight", v)}
                      />
                      <TouchableOpacity
                        onPress={() => removeSet(exIdx, sIdx)}
                        style={styles.removeSetBtn}
                      >
                        <Ionicons name="remove-circle-outline" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={() => addSet(exIdx)}
                    style={styles.addSetBtn}
                  >
                    <Ionicons name="add" size={18} color="#7B5CF0" />
                    <Text style={styles.addSetText}>Add set</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.setsSummary}>
                  {se.sets.length} set{se.sets.length > 1 ? "s" : ""}
                  {se.sets[0]?.weight > 0
                    ? ` · ${se.sets[0].reps}×${se.sets[0].weight}kg`
                    : ` · ${se.sets[0]?.reps} reps`}
                </Text>
              )}
            </View>
          ))}

          {/* Add exercise button */}
          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => setPickerVisible(true)}
          >
            <Ionicons name="add-circle" size={22} color="#7B5CF0" />
            <Text style={styles.addExerciseText}>Add exercise</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerBackdrop}>
          <SafeAreaView style={styles.pickerSheet} edges={["bottom"]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t.search} exercises</Text>
              <TouchableOpacity onPress={() => { setPickerVisible(false); setSearchQuery(""); }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color="#555" />
              <TextInput
                style={styles.searchInput}
                placeholder={t.search}
                placeholderTextColor="#555"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            {loadingExercises ? (
              <ActivityIndicator color="#7B5CF0" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredExercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const selected = alreadySelectedIds.has(item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, selected && styles.pickerItemDisabled]}
                      onPress={() => !selected && addExercise(item)}
                      disabled={selected}
                    >
                      <View style={styles.pickerIcon}>
                        <Ionicons
                          name="barbell-outline"
                          size={20}
                          color={selected ? "#444" : "#7B5CF0"}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerName, selected && { color: "#444" }]}>
                          {item.name}
                        </Text>
                        {item.equipment_type !== "none" && (
                          <Text style={styles.pickerEquip}>
                            {item.equipment_type.replace(/_/g, " ")}
                          </Text>
                        )}
                      </View>
                      {selected && (
                        <Ionicons name="checkmark-circle" size={20} color="#444" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.pickerEmpty}>
                    <Text style={styles.pickerEmptyText}>No exercises found</Text>
                  </View>
                }
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  headerBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "600" },
  saveBtnWrap: {
    backgroundColor: "#7B5CF0",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  scrollContent: { padding: 16 },

  inputCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  titleInput: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  descInput: {
    color: "#aaa",
    fontSize: 14,
    paddingVertical: 8,
    minHeight: 40,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },

  exerciseItem: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  exerciseIndex: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseIndexText: { color: "#7B5CF0", fontSize: 13, fontWeight: "700" },
  exerciseName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  exerciseEquip: { color: "#666", fontSize: 11, textTransform: "capitalize", marginTop: 1 },
  exerciseActions: { flexDirection: "row", gap: 4 },
  smallBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },

  setsSummary: { color: "#888", fontSize: 12, marginTop: 8, marginLeft: 42 },

  setsEditor: { marginTop: 12, marginLeft: 42 },
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  setHeaderText: { color: "#555", fontSize: 11, fontWeight: "600", width: 50, textAlign: "center" },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  setNum: { color: "#555", fontSize: 13, width: 50, textAlign: "center" },
  setInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    width: 50,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  removeSetBtn: { width: 28, alignItems: "center" },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  addSetText: { color: "#7B5CF0", fontSize: 13, fontWeight: "500" },

  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#7B5CF022",
    borderStyle: "dashed",
    paddingVertical: 16,
    marginTop: 4,
  },
  addExerciseText: { color: "#7B5CF0", fontSize: 15, fontWeight: "600" },

  // Picker modal
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  pickerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 10,
  },

  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  pickerItemDisabled: { opacity: 0.4 },
  pickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#2a1f4a",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  pickerEquip: { color: "#666", fontSize: 11, textTransform: "capitalize", marginTop: 2 },
  pickerEmpty: { alignItems: "center", marginTop: 40 },
  pickerEmptyText: { color: "#555", fontSize: 15 },
});
