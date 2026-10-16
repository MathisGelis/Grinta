import { View, Text, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  FollowRequest,
  ConnectionsService,
} from "@/services/connections.service";

import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
export default function RequestedUsers({
  requests,
  setRequests,
}: {
  requests: FollowRequest[];
  setRequests: React.Dispatch<React.SetStateAction<FollowRequest[]>>;
}) {
  const { t } = useTranslation();
  const handleAccept = async (requestId: string) => {
    try {
      await ConnectionsService.acceptRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await ConnectionsService.rejectRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.error);
    }
  };
  return (
    <>
      {requests.length > 0 ? (
        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">
            {t.requestsLabel} ({requests.length})
          </Text>
          {requests.map((req) => (
            <View
              key={req.request_id}
              className="flex-row items-center gap-3 rounded-card bg-surface p-3 pr-4"
            >
              <PressableScale
                className="flex-1 flex-row items-center gap-[10px]"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/explore/user-profile",
                    params: { userId: req.user_id },
                  } as any)
                }
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
                  <Text className="text-base font-bold text-ink">
                    {req.user_displayName?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-ink">
                    {req.user_displayName}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-ink-muted">
                    @{req.user_uniqueName}
                  </Text>
                </View>
              </PressableScale>
              <PressableScale
                className="h-11 w-11 items-center justify-center rounded-full bg-success"
                onPress={() => handleAccept(req.request_id)}
              >
                <Ionicons name="checkmark" size={20} color={WorkoutTheme.text.primary} />
              </PressableScale>
              <PressableScale
                className="h-11 w-11 items-center justify-center rounded-full bg-danger"
                onPress={() => handleReject(req.request_id)}
              >
                <Ionicons name="close" size={20} color={WorkoutTheme.text.primary} />
              </PressableScale>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}
