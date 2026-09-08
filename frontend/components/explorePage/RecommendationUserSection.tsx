import { View, Text } from "react-native";
import { RecommendedUsersList } from "@/components/explorePage/RecommendedUsersList";
import { User } from "@/services/user.service";

export default function RecommendationUserSection({
  users,
  setUsers,
}: {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}) {
  const handleDismissUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <>
      {users.length > 0 && (
        <>
          <View className="mx-4 mb-3 flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-white">
              Utilisateurs recommandés
            </Text>
          </View>
          <RecommendedUsersList users={users} onDismiss={handleDismissUser} />
        </>
      )}
    </>
  );
}
