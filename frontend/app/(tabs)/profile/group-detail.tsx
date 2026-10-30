import React, { useCallback, useState } from "react";
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
  type GroupUser,
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
import { FormField, TextField } from "@/components/ui/FormField";

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
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [busy, setBusy] = useState(false);

  const isCreator = !!group && group.creatorId === myId;

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

  const rename = () => {
    const name = draftName.trim();
    if (!groupId || !name) return;
    run(
      () => GroupsService.rename(groupId, name),
      async () => {
        setRenaming(false);
        await load();
      },
    );
  };

  const invite = () => {
    if (!groupId || !inviteName.trim()) return;
    run(
      () => GroupsService.invite(groupId, inviteName),
      async () => {
        setInviteName("");
        await load();
      },
    );
  };

  const leave = () =>
    Alert.alert(t.grpLeave, t.grpLeaveConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.grpLeave,
        style: "destructive",
        onPress: () => groupId && run(() => GroupsService.leave(groupId), () => router.back()),
      },
    ]);

  const remove = () =>
    Alert.alert(t.grpDelete, t.grpDeleteConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.grpDelete,
        style: "destructive",
        onPress: () => groupId && run(() => GroupsService.remove(groupId), () => router.back()),
      },
    ]);

  const removeShare = (shareId: string) =>
    groupId && run(() => GroupsService.removeShare(groupId, shareId), load);

  const openPost = (event: GroupEvent) => {
    const author = event.type === "share" ? event.author : event.user;
    router.push({
      pathname: "/(tabs)/profile/userPost",
      params: {
        postId: event.postId,
        post: JSON.stringify({
          id: event.postId,
          createdAt: event.at,
          userId: author.id,
          displayName: author.displayName,
          avatarThumbnailUrl: author.avatarThumbnailUrl,
        }),
      },
    } as any);
  };

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString(LOCALES[lang], { day: "numeric", month: "short" });

  const person = (user: GroupUser, subtitle?: string, right?: React.ReactNode) => (
    <View key={user.id} className="flex-row items-center gap-3 rounded-tile bg-raised p-3">
      <Avatar uri={user.avatarThumbnailUrl} name={user.displayName} size={36} />
      <View className="flex-1">
        <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text className="text-xs text-ink-muted" numberOfLines={1}>
          {subtitle ?? `@${user.uniqueName}`}
        </Text>
      </View>
      {right}
    </View>
  );

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader
        title={group?.name ?? ""}
        right={
          group ? (
            <IconButton
              icon="create-outline"
              label={t.grpRename}
              onPress={() => {
                setDraftName(group.name);
                setRenaming((value) => !value);
              }}
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        >
          {renaming ? (
            <Card size="tile" className="gap-3">
              <TextField value={draftName} onChangeText={setDraftName} maxLength={50} />
              <Button
                label={t.save}
                loading={busy}
                disabled={!draftName.trim()}
                onPress={rename}
              />
            </Card>
          ) : null}

          <Card className="gap-3">
            <Text className="text-lg font-semibold text-ink">
              {t.grpMembers} · {group.members.length}
            </Text>
            {group.members.map((member) =>
              person(
                member,
                member.id === group.creatorId ? t.grpCreator : `@${member.uniqueName}`,
              ),
            )}
          </Card>

          <Card className="gap-3">
            <FormField label={t.grpInviteLabel}>
              <TextField
                placeholder={t.grpInvitePlaceholder}
                value={inviteName}
                onChangeText={setInviteName}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
              />
            </FormField>
            <Button
              icon="person-add-outline"
              label={t.grpInviteSend}
              loading={busy}
              disabled={!inviteName.trim()}
              onPress={invite}
            />
            {group.invitations.length > 0 ? (
              <View className="gap-2">
                <Text className="px-1 text-xs font-semibold uppercase text-ink-soft">
                  {t.grpPending}
                </Text>
                {group.invitations.map((invitation) =>
                  person(invitation.invitee, `@${invitation.invitee.uniqueName}`),
                )}
              </View>
            ) : null}
          </Card>

          <Text className="mt-2 text-xl font-semibold text-ink">{t.grpActivity}</Text>
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

          <Button variant="secondary" icon="exit-outline" label={t.grpLeave} onPress={leave} />
          {isCreator ? (
            <Button variant="danger" icon="trash-outline" label={t.grpDelete} onPress={remove} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
