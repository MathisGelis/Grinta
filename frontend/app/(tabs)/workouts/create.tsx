import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

export default function CreateWorkoutScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [exerciseInput, setExerciseInput] = useState("");
  const [exercises, setExercises] = useState<string[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addExercise = () => {
    if (!exerciseInput.trim()) return;
    setExercises([...exercises, exerciseInput.trim()]);
    setExerciseInput("");
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const createWorkout = () => {
    const workout = {
      name,
      description,
      image,
      exercises,
    };

    console.log("Workout created:", workout);
    // ➜ appel API / store global plus tard
  };

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      {/* Name */}
      <Text className="text-lg font-semibold mb-2">Nom de la séance</Text>
      <TextInput
        placeholder="Ex: Push Day"
        className="bg-gray-100 rounded-lg px-4 py-3 mb-4"
        value={name}
        onChangeText={setName}
      />

      {/* Description */}
      <Text className="text-lg font-semibold mb-2">Description</Text>
      <TextInput
        placeholder="Objectif, sensations, notes..."
        multiline
        numberOfLines={4}
        className="bg-gray-100 rounded-lg px-4 py-3 mb-4 text-base"
        value={description}
        onChangeText={setDescription}
      />

      {/* Image */}
      <Text className="text-lg font-semibold mb-2">Photo</Text>
      <TouchableOpacity
        onPress={pickImage}
        className="bg-gray-100 rounded-lg h-40 items-center justify-center mb-4"
      >
        {image ? (
          <Image source={{ uri: image }} className="w-full h-full rounded-lg" />
        ) : (
          <Ionicons name="image-outline" size={40} color="#999" />
        )}
      </TouchableOpacity>

      {/* Exercises */}
      <Text className="text-lg font-semibold mb-2">Exercices</Text>

      <View className="flex-row gap-2 mb-3">
        <TextInput
          placeholder="Ex: Bench Press"
          className="flex-1 bg-gray-100 rounded-lg px-4 py-3"
          value={exerciseInput}
          onChangeText={setExerciseInput}
        />
        <TouchableOpacity
          onPress={addExercise}
          className="bg-black rounded-lg px-4 items-center justify-center"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {exercises.map((exercise, index) => (
        <View
          key={index}
          className="flex-row justify-between items-center bg-gray-50 px-4 py-3 rounded-lg mb-2"
        >
          <Text className="text-base">{exercise}</Text>
          <TouchableOpacity onPress={() => removeExercise(index)}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Save */}
      <TouchableOpacity
        onPress={createWorkout}
        className="bg-[#7C5DB7] rounded-xl py-4 mt-6 mb-10"
      >
        <Text className="text-white text-center text-lg font-semibold">
          Créer la séance
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
