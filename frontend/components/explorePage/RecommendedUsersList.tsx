import { ScrollView, TouchableOpacity, Text } from "react-native";
import { User } from "@/services/social.service";
import { WorkoutTheme } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type RecommendedUsersListProps = {
  users: User[];
  onDismiss: (userId: string) => void;
};

export function RecommendedUsersList({
  users,
  onDismiss,
}: RecommendedUsersListProps) {
  const handlePress = (user: User) => {
    router.push({
      pathname: "/(tabs)/explore/user-profile",
      params: { userId: user.id },
    });
  };
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row px-4 py-2"
      contentContainerClassName="gap-3"
    >
      {users.map((user) => (
        <TouchableOpacity
          key={user.id}
          className="w-28 h-24 items-center justify-center relative rounded-md"
          style={{ backgroundColor: WorkoutTheme.backgroundSecondary }}
          onPress={() => handlePress(user)}
        >
          <Ionicons
            name="close-outline"
            size={14}
            color="white"
            className="absolute right-0 top-0 m-2"
            onPress={() => onDismiss(user.id)}
          />
          <Ionicons name="person-circle-outline" size={40} color="white" />
          <Text className="text-sm font-semibold text-white pt-2">
            {user.displayName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
