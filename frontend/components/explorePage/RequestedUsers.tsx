import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  FollowRequest,
  ConnectionsService,
} from "@/services/connections.service";

export default function RequestedUsers({
  requests,
  setRequests,
}: {
  requests: FollowRequest[];
  setRequests: React.Dispatch<React.SetStateAction<FollowRequest[]>>;
}) {
  const handleAccept = async (requestId: string) => {
    try {
      await ConnectionsService.acceptRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await ConnectionsService.rejectRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err: any) {
      Alert.alert("Erreur", err.message || "Erreur");
    }
  };
  return (
    <>
      {requests.length > 0 ? (
        <View className="mx-4 mb-4">
          <Text className="mb-2.5 mt-1 text-[13px] font-semibold uppercase tracking-[0.5px] text-[#888]">
            Demandes ({requests.length})
          </Text>
          {requests.map((req) => (
            <View
              key={req.request_id}
              className="mb-2 flex-row items-center gap-[10px] rounded-[14px] bg-[#1a1a1a] p-3"
            >
              <TouchableOpacity
                className="flex-1 flex-row items-center gap-[10px]"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/explore/user-profile",
                    params: { userId: req.user_id },
                  } as any)
                }
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#2a1f4a]">
                  <Text className="text-base font-bold text-white">
                    {req.user_displayName?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-white">
                    {req.user_displayName}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-[#888]">
                    @{req.user_uniqueName}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#34D399]"
                onPress={() => handleAccept(req.request_id)}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#FF6B6B]"
                onPress={() => handleReject(req.request_id)}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
