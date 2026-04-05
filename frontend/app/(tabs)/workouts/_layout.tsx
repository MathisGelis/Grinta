import { Stack, router } from "expo-router";
import { TouchableOpacity, Text } from "react-native";

export default function WorkoutsStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen
        name="create"
        options={{
          title: "New workout",
          presentation: "modal",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="m-2">
              <Text className="text-white font-semibold text-lg">Cancel</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
