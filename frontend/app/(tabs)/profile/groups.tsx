import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import {
  GroupsService,
  type GroupSummary,
  type ReceivedInvitation,
} from "@/services/groups.service";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import { TextField } from "@/components/ui/FormField";

export default function GroupsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [invitations, setInvitations] = useState<ReceivedInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyInvitation, setBusyInvitation] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [mine, received] = await Promise.all([
        GroupsService.list(),
        GroupsService.receivedInvitations().catch(() => []),
      ]);
      setGroups(mine);
      setInvitations(received);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    try {
      setCreating(true);
      const group = await GroupsService.create(trimmed);
      setName("");
      router.push({ pathname: "/(tabs)/profile/group-detail", params: { groupId: group.id } } as any);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setCreating(false);
    }
  };

  const answer = async (invitation: ReceivedInvitation, accept: boolean) => {
    try {
      setBusyInvitation(invitation.id);
      if (accept) {
        const group = await GroupsService.accept(invitation.id);
        router.push({ pathname: "/(tabs)/profile/group-detail", params: { groupId: group.id } } as any);
      } else {
        await GroupsService.decline(invitation.id);
      }
      await load();
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setBusyInvitation(null);
    }
  };

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader title={t.grpTitle} />
      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-4 px-5"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        >
          {invitations.length > 0 ? (
            <View className="gap-2">
              <Text className="px-1 text-sm font-semibold text-ink-soft">{t.grpInvitations}</Text>
              {invitations.map((invitation) => (
                <Card key={invitation.id} size="tile" tone="accentTint" className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <Avatar
                      uri={invitation.invitedBy.avatarThumbnailUrl}
                      name={invitation.invitedBy.displayName}
                      size={40}
                    />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                        {invitation.group.name}
                      </Text>
                      <Text className="text-xs text-ink-muted" numberOfLines={1}>
                        {format(t.grpInvitedBy, { name: invitation.invitedBy.displayName })} ·{" "}
                        {format(t.grpMemberCount, { n: invitation.group.memberCount })}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-3">
                    <Button
                      className="flex-1"
                      variant="secondary"
                      label={t.grpDecline}
                      disabled={busyInvitation === invitation.id}
                      onPress={() => answer(invitation, false)}
                    />
                    <Button
                      className="flex-1"
                      label={t.grpAccept}
                      loading={busyInvitation === invitation.id}
                      onPress={() => answer(invitation, true)}
                    />
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          <Card size="tile" className="gap-3">
            <TextField
              placeholder={t.grpNamePlaceholder}
              value={name}
              onChangeText={setName}
              maxLength={50}
              editable={!creating}
            />
            <Button
              icon="add"
              label={t.grpCreate}
              loading={creating}
              disabled={!name.trim()}
              onPress={create}
            />
          </Card>

          {groups.length === 0 ? (
            <Text className="py-6 text-center text-sm text-ink-muted">{t.grpEmpty}</Text>
          ) : (
            groups.map((group) => (
              <PressableScale
                key={group.id}
                halo={false}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/profile/group-detail",
                    params: { groupId: group.id },
                  } as any)
                }
                className="rounded-tile bg-surface p-4"
              >
                <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                  {group.name}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-muted">
                  {format(t.grpMemberCount, { n: group.memberCount })}
                </Text>
              </PressableScale>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
