import React, { useEffect, useState } from "react";
import { View, Text, Image, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SearchUser } from "@/services/user.service";
import { ConnectionsService } from "@/services/connections.service";

import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
interface SearchUserCardProps {
  user: SearchUser;
}

type FollowStatus =
  | "SELF"
  | "FOLLOWING"
  | "REQUEST_SENT"
  | "FOLLOW"
  | "FOLLOW_BACK";

export default function SearchUserCard({ user }: SearchUserCardProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<FollowStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ConnectionsService.getFollowStatus(user.id)
      .then((res) => {
        const raw = res as unknown;
        const value =
          typeof raw === "string"
            ? raw
            : ((raw as { status?: string; followStatus?: string })?.status ??
              (raw as { followStatus?: string })?.followStatus);
        if (!cancelled) setStatus((value as FollowStatus) ?? "FOLLOW");
      })
      .catch(() => {
        if (!cancelled) setStatus("FOLLOW");
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const toggleFollow = async () => {
    setBusy(true);
    try {
      if (status === "FOLLOWING") {
        await ConnectionsService.unfollow(user.id);
        setStatus("FOLLOW");
      } else {
        const result = await ConnectionsService.follow(user.id);
        setStatus(result.status === "FOLLOWING" ? "FOLLOWING" : "REQUEST_SENT");
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.error);
    } finally {
      setBusy(false);
    }
  };

  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/explore/user-profile",
      params: { userId: user.id },
    });
  };

  return (
    <PressableScale
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${user.displayName} @${user.uniqueName}`}
      className="flex-row items-center gap-3 rounded-card bg-surface p-3 pr-4"
    >
      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-accent-tint">
        {user.image_url ? (
          <Image source={{ uri: user.image_url }} className="h-full w-full" />
        ) : (
          <Text className="text-xl font-semibold text-accent">
            {user.displayName?.[0]?.toUpperCase() ?? "?"}
          </Text>
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-ink" numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
          @{user.uniqueName}
        </Text>
      </View>

      {status === null ? (
        <View className="h-10 w-10 items-center justify-center">
          <ActivityIndicator size="small" color={WorkoutTheme.text.tertiary} />
        </View>
      ) : status === "SELF" ? null : status === "REQUEST_SENT" ? (
        <View className="h-10 items-center justify-center rounded-full bg-raised px-4">
          <Text className="text-sm font-semibold text-ink-muted">
            {t.requestSent}
          </Text>
        </View>
      ) : (
        <PressableScale
          onPress={toggleFollow}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={
            status === "FOLLOWING" ? t.unfollowAction : t.followAction
          }
          className={`h-10 min-w-[84px] items-center justify-center rounded-full px-4 ${
            status === "FOLLOWING" ? "bg-raised" : "bg-accent"
          } ${busy ? "opacity-60" : ""}`}
        >
          <Text className="text-sm font-semibold text-ink">
            {status === "FOLLOWING"
              ? t.followingStatus
              : status === "FOLLOW_BACK"
                ? t.followBackAction
                : t.followAction}
          </Text>
        </PressableScale>
      )}
    </PressableScale>
  );
}
