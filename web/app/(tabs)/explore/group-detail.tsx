import React, { useCallback, useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { LOCALES } from "@/i18n/labels";
import { format } from "@/i18n/translations";
import {
  GroupsService,
  type GroupDetail,
  type GroupEvent,
} from "@/services/groups.service";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import IconButton from "@/components/ui/IconButton";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";

const PAGE_SIZE = 20;

export default function GroupDetailScreen() {
  const { t, lang } = useTranslation();
  const insets = useSafeAreaInsets();
  const myId = useCurrentUserId();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      setError(null);
      const [detail, activity] = await Promise.all([
        GroupsService.get(groupId),
        GroupsService.activity(groupId, { limit: PAGE_SIZE }).catch(() => [] as GroupEvent[]),
      ]);
      setGroup(detail);
      setEvents(activity);
      setHasMore(activity.length === PAGE_SIZE);
    } catch (err) {
      // `404` : groupe supprimé ou je n'en suis plus membre.
      setError(err instanceof Error ? err.message : t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [groupId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const loadMore = async () => {
    const last = events[events.length - 1];
    if (!groupId || !last || loadingMore) return;
    try {
      setLoadingMore(true);
      const next = await GroupsService.activity(groupId, { limit: PAGE_SIZE, before: last.at });
      setEvents((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setLoadingMore(false);
    }
  };

  const run = async (action: () => Promise<unknown>, after?: () => void | Promise<void>) => {
    try {
      setBusy(true);
      await action();
      await after?.();
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setBusy(false);
    }
  };

  const removeShare = (shareId: string) =>
    groupId && run(() => GroupsService.removeShare(groupId, shareId), load);

  const openPost = (event: GroupEvent) => {
    router.push({
      pathname: "/(tabs)/explore/userPost",
      params: { postId: event.postId },
    } as any);
  };

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALES[lang], { day: "numeric", month: "short" });

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader
        glass
        title={group?.name ?? ""}
        right={
          group ? (
            <IconButton
              icon="settings-outline"
              variant="glass"
              label={t.grpSettings}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/explore/group-settings",
                  params: { groupId },
                } as any)
              }
            />
          ) : undefined
        }
      />

      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : error || !group ? (
        <View className="items-center px-5">
          <Text className="text-danger">{error ?? t.loadingError}</Text>
        </View>
      ) : (
        <ScrollView {...chromeScrollProps}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        >
          
          {events.length === 0 ? (
            <Text className="py-4 text-center text-sm text-ink-muted">{t.grpNoActivity}</Text>
          ) : (
            events.map((event) => (
              <Card
                key={event.type === "share" ? event.shareId : `${event.postId}-${event.at}`}
                size="tile"
                className="gap-3"
              >
                <PressableScale
                  halo={false}
                  accessibilityRole="button"
                  accessibilityLabel={t.grpOpen}
                  onPress={() => openPost(event)}
                  className="flex-row items-center gap-3"
                >
                  <Avatar
                    uri={event.user.avatarThumbnailUrl}
                    name={event.user.displayName}
                    size={40}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-ink">
                      {event.type === "workout"
                        ? format(t.grpWorkoutEvent, { name: event.user.displayName })
                        : format(t.grpShareEvent, {
                            name: event.user.displayName,
                            author: event.author.displayName,
                          })}
                    </Text>
                    <Text className="mt-0.5 text-xs text-ink-muted" numberOfLines={1}>
                      {event.workout.title} · {date(event.at)}
                    </Text>
                  </View>
                </PressableScale>

                {event.type === "workout"
                  ? event.records.map((record, index) => (
                      <View
                        key={`${record.exercise.id}-${record.type}-${index}`}
                        className="flex-row items-center gap-2 rounded-full bg-accent-tint px-3 py-2"
                      >
                        <Text className="flex-1 text-xs text-ink" numberOfLines={1}>
                          {format(t.grpRecordEvent, { exercise: record.exercise.name })}
                        </Text>
                        <Text className="text-xs font-semibold text-ink">
                          {record.value} {record.unit}
                        </Text>
                      </View>
                    ))
                  : event.user.id === myId ? (
                      <Button
                        variant="danger"
                        label={t.grpRemoveShare}
                        disabled={busy}
                        onPress={() => removeShare(event.shareId)}
                      />
                    ) : null}
              </Card>
            ))
          )}
          {hasMore ? (
            <Button
              variant="secondary"
              label={t.grpLoadMore}
              loading={loadingMore}
              onPress={loadMore}
            />
          ) : null}

        </ScrollView>
      )}
    </View>
  );
}
