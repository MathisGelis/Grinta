import React, { useCallback, useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { GroupsService, type GroupDetail, type GroupUser } from "@/services/groups.service";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import GroupIcon from "@/components/groups/GroupIcon";
import Avatar from "@/components/ui/Avatar";
import { TextField } from "@/components/ui/FormField";

/** Gestion d'un groupe : nom, membres, invitations, départ et suppression. */
export default function GroupSettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const myId = useCurrentUserId();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const isCreator = !!group && group.creatorId === myId;

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      setError(null);
      const detail = await GroupsService.get(groupId);
      setGroup(detail);
      setDraftName(detail.name);
    } catch (err) {
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

  const leave = () =>
    Alert.alert(t.grpLeave, t.grpLeaveConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.grpLeave,
        style: "destructive",
        onPress: () => groupId && run(() => GroupsService.leave(groupId), () => router.replace("/(tabs)/explore/groups" as any)),
      },
    ]);

  const remove = () =>
    Alert.alert(t.grpDelete, t.grpDeleteConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.grpDelete,
        style: "destructive",
        onPress: () => groupId && run(() => GroupsService.remove(groupId), () => router.replace("/(tabs)/explore/groups" as any)),
      },
    ]);

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

  // Quitter ou supprimer ramène à la liste des groupes (le détail n'existe plus pour moi).
  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader title="" glass />

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
          <View className="items-center gap-1">
            <View className="mb-2">
              <GroupIcon name={group.name} size={96} ring />
            </View>
            <Text className="px-4 text-center text-xl font-semibold text-ink" numberOfLines={2}>
              {group.name}
            </Text>
          </View>

          <View className="flex-row justify-center gap-4 py-4">
            <IconButton
              icon="create-outline"
              size={52}
              label={t.grpRename}
              onPress={() => {
                setDraftName(group.name);
                setRenaming((value) => !value);
              }}
            />
            {isCreator ? (
              <IconButton
                icon="trash-outline"
                size={52}
                variant="danger"
                label={t.grpDelete}
                onPress={remove}
              />
            ) : null}
            <IconButton icon="exit-outline" size={52} label={t.grpLeave} onPress={leave} />
          </View>

          {renaming ? (
            <Card size="tile" className="gap-3">
              <TextField autoFocus value={draftName} onChangeText={setDraftName} maxLength={50} />
              <Button
                label={t.save}
                loading={busy}
                disabled={!draftName.trim() || draftName.trim() === group.name}
                onPress={rename}
              />
            </Card>
          ) : null}

          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-ink">
                {t.grpMembers} · {group.members.length}
              </Text>
              <IconButton
                icon="add"
                size={40}
                label={t.grpAddMember}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/explore/group-add-member",
                    params: { groupId },
                  } as any)
                }
              />
            </View>
            {group.members.map((member) =>
              person(
                member,
                member.id === group.creatorId ? t.grpCreator : `@${member.uniqueName}`,
              ),
            )}
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
        </ScrollView>
      )}
    </View>
  );
}
