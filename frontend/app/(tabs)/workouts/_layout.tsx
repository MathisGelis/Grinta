import { Stack, router } from "expo-router";
import { TouchableOpacity, Text } from "react-native";

export default function WorkoutsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="createWorkout"
        options={{
          presentation: "modal",
          title: "Créer une séance",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-violet-600 font-semibold">Annuler</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="createExercise"
        options={{
          presentation: "modal",
          title: "Créer un exercice",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-violet-600 font-semibold">Annuler</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="createProgramm"
        options={{
          presentation: "modal",
          title: "Créer un programme",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-violet-600 font-semibold">Annuler</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
