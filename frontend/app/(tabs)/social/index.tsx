import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TextInput, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ConnectionsService, UserListItem, FollowRequest } from "@/services/connections.service";
import { UserService } from "@/services/user.service";

import { WorkoutTheme } from "@/constants/Colors";
import PressableScale from "@/components/ui/PressableScale";
import { useTranslation } from "@/contexts/LanguageContext";
export default function SocialScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<UserListItem[]>([]);
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const me = await UserService.getMe();
      setUserId(me.id);

      const [recs, followingData, requestsData] = await Promise.all([
        ConnectionsService.getRecommendations().catch(() => []),
        ConnectionsService.getFollowing(me.id).catch(() => []),
        ConnectionsService.getRequests().catch(() => []),
      ]);

      setRecommendations(recs);
      setFollowingIds(new Set(followingData.map((u) => u.id)));
      setRequests(requestsData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await ConnectionsService.searchUsers(searchQuery.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleFollow = async (targetId: string) => {
    try {
      const result = await ConnectionsService.follow(targetId);
      if (result.status === "FOLLOWING") {
        setFollowingIds((prev) => new Set([...prev, targetId]));
      } else if (result.status === "REQUEST_SENT") {
        setPendingIds((prev) => new Set([...prev, targetId]));
      }
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.cannotFollow);
    }
  };

  const handleUnfollow = async (targetId: string) => {
    try {
      await ConnectionsService.unfollow(targetId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    } catch (err: any) {
      Alert.alert(t.error, err.message || t.cannotUnfollow);
    }
  };

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

  const displayList = searchQuery.trim() ? searchResults : recommendations;

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-4 pt-16 pb-3">
        <PressableScale onPress={() => router.back()} className="w-10 h-10 rounded-full bg-surface items-center justify-center">
          <Ionicons name="chevron-back" size={24} color={WorkoutTheme.text.primary} />
        </PressableScale>
        <Text className="text-ink text-lg font-bold">{t.socialTitle}</Text>
        <View className="w-10" />
      </View>

      <View className="flex-row items-center mx-4 bg-surface rounded-tile px-3 py-2.5 mb-4 gap-2">
        <Ionicons name="search" size={18} color={WorkoutTheme.text.disabled} />
        <TextInput
          className="flex-1 text-ink text-[15px]"
          placeholder={t.searchEllipsis}
          placeholderTextColor={WorkoutTheme.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <PressableScale onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={WorkoutTheme.text.disabled} />
          </PressableScale>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {!searchQuery.trim() && requests.length > 0 && (
          <>
            <Text className="text-ink-muted text-[13px] font-semibold uppercase tracking-[0.5px] mb-2.5 mt-1">{t.requestsLabel} ({requests.length})</Text>
            {requests.map((req) => (
              <View key={req.request_id} className="flex-row items-center bg-surface rounded-tile p-3 mb-2 gap-2.5">
                <PressableScale
                  className="flex-row items-center flex-1 gap-2.5"
                  onPress={() => router.push({ pathname: "/(tabs)/social/user-profile", params: { userId: req.user_id } } as any)}
                >
                  <View className="w-10 h-10 rounded-full bg-accent-tint items-center justify-center">
                    <Text className="text-ink text-base font-bold">
                      {req.user_displayName?.[0]?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-ink text-sm font-semibold">{req.user_displayName}</Text>
                    <Text className="text-ink-muted text-xs mt-[1px]">@{req.user_uniqueName}</Text>
                  </View>
                </PressableScale>
                <PressableScale className="w-[30px] h-[30px] rounded-[15px] bg-success items-center justify-center" onPress={() => handleAccept(req.request_id)}>
                  <Ionicons name="checkmark" size={16} color={WorkoutTheme.text.primary} />
                </PressableScale>
                <PressableScale className="w-[30px] h-[30px] rounded-[15px] bg-danger items-center justify-center" onPress={() => handleReject(req.request_id)}>
                  <Ionicons name="close" size={16} color={WorkoutTheme.text.primary} />
                </PressableScale>
              </View>
            ))}
          </>
        )}

        {!searchQuery.trim() && (
          <Text className="text-ink-muted text-[13px] font-semibold uppercase tracking-[0.5px] mb-2.5 mt-1">{t.suggestions}</Text>
        )}
        {searchQuery.trim() && (
          <Text className="text-ink-muted text-[13px] font-semibold uppercase tracking-[0.5px] mb-2.5 mt-1">{t.resultsLabel}</Text>
        )}

        {loading || searching ? (
          <ActivityIndicator size="small" color={WorkoutTheme.accent.purple} style={{ marginTop: 24 }} />
        ) : displayList.length === 0 ? (
          <View className="items-center mt-12 gap-2.5">
            <Ionicons
              name={searchQuery.trim() ? "search-outline" : "people-outline"}
              size={36}
              color={WorkoutTheme.text.disabled}
            />
            <Text className="text-ink-faint text-sm">
              {searchQuery.trim() ? t.noResultsLabel : t.noSuggestionsLabel}
            </Text>
          </View>
        ) : (
          displayList.map((u) => (
            <View key={u.id} className="flex-row items-center bg-surface rounded-tile p-3 mb-2 gap-2.5">
              <PressableScale
                className="flex-row items-center flex-1 gap-2.5"
                onPress={() => router.push({ pathname: "/(tabs)/social/user-profile", params: { userId: u.id } } as any)}
              >
                <View className="w-10 h-10 rounded-full bg-accent-tint items-center justify-center">
                  <Text className="text-ink text-base font-bold">
                    {u.displayName?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-ink text-sm font-semibold">{u.displayName}</Text>
                  <Text className="text-ink-muted text-xs mt-[1px]">@{u.uniqueName}</Text>
                </View>
              </PressableScale>
              {u.id !== userId && (
                followingIds.has(u.id) ? (
                  <PressableScale className="bg-transparent px-3.5 py-1.5 rounded-tile border border-line" onPress={() => handleUnfollow(u.id)}>
                    <Text className="text-ink-muted text-xs font-semibold">{t.followingStatus}</Text>
                  </PressableScale>
                ) : pendingIds.has(u.id) ? (
                  <View className="bg-transparent px-3.5 py-1.5 rounded-tile border border-line">
                    <Text className="text-ink-faint text-xs font-semibold">{t.sentShort}</Text>
                  </View>
                ) : (
                  <PressableScale className="bg-accent px-3.5 py-1.5 rounded-full" onPress={() => handleFollow(u.id)}>
                    <Text className="text-ink text-xs font-semibold">{t.followAction}</Text>
                  </PressableScale>
                )
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
