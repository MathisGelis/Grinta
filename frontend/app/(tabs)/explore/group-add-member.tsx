import React, { useCallback, useMemo, useState } from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { GroupsService, type GroupDetail } from "@/services/groups.service";
import { ConnectionsService, type UserListItem } from "@/services/connections.service";
import { UserService } from "@/services/user.service";
import ScreenBackground from "@/components/ui/ScreenBackground";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { TAB_BAR_SPACE } from "@/components/ui/Screen";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import Button from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";

/**
 * Invitation dans un groupe. Le serveur n'expose pas de recherche dans ses abonnements :
 * on croise `following` et `followers` (seuls les suivis mutuels sont invitables) et on filtre en local.
 */
export default function GroupAddMemberScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [mutuals, setMutuals] = useState<UserListItem[]>([]);
  const [invitedNow, setInvitedNow] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      const myId = await UserService.getMyId();
      if (!myId) return;
      const [detail, following, followers] = await Promise.all([
        GroupsService.get(groupId),
        ConnectionsService.getFollowing(myId),
        ConnectionsService.getFollowers(myId),
      ]);
      const followerIds = new Set(followers.map((u) => u.id));
      setGroup(detail);
      setMutuals(following.filter((u) => followerIds.has(u.id)));
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [groupId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const candidates = useMemo(() => {
    const memberIds = new Set(group?.members.map((m) => m.id));
    const pendingIds = new Set(group?.invitations.map((i) => i.invitee.id));
    const q = query.trim().toLowerCase().replace(/^@/, "");
    return mutuals
      .filter((u) => !memberIds.has(u.id))
      .filter(
        (u) => !q || u.uniqueName.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q),
      )
      .map((u) => ({ user: u, invited: pendingIds.has(u.id) || invitedNow.has(u.id) }));
  }, [mutuals, group, query, invitedNow]);

  const invite = async (user: UserListItem) => {
    if (!groupId || busyId) return;
    try {
      setBusyId(user.id);
      await GroupsService.invite(groupId, user.uniqueName);
      setInvitedNow((prev) => new Set(prev).add(user.id));
    } catch (err) {
      // 403 : plus de suivi mutuel ; 409 : déjà invité ou groupe complet.
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View className="flex-1">
      <ScreenBackground flat />
      <ScreenHeader title={t.grpAddMember} glass />
      {loading ? (
        <ActivityIndicator size="large" color={WorkoutTheme.accent.purple} />
      ) : (
        <ScrollView {...chromeScrollProps}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-3 px-5"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        >
          <TextField
            icon="search"
            placeholder={t.grpSearchMutual}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {candidates.length === 0 ? (
            <Text className="py-6 text-center text-sm text-ink-muted">{t.grpNoMutual}</Text>
          ) : (
            candidates.map(({ user, invited }) => (
              <View key={user.id} className="flex-row items-center gap-3 rounded-tile bg-surface p-3">
                <PressableScale
                  halo={false}
                  accessibilityRole="button"
                  accessibilityLabel={user.displayName}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/explore/user-profile",
                      params: { userId: user.id },
                    } as any)
                  }
                  className="flex-1 flex-row items-center gap-3"
                >
                  <Avatar uri={user.avatarThumbnailUrl} name={user.displayName} size={40} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                      {user.displayName}
                    </Text>
                    <Text className="text-xs text-ink-muted" numberOfLines={1}>
                      @{user.uniqueName}
                    </Text>
                  </View>
                </PressableScale>
                {invited ? (
                  <Text className="px-3 text-xs font-medium text-ink-muted">{t.grpInvited}</Text>
                ) : (
                  <Button
                    className="h-10 px-4"
                    label={t.grpInviteBtn}
                    loading={busyId === user.id}
                    disabled={!!busyId}
                    onPress={() => invite(user)}
                  />
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
