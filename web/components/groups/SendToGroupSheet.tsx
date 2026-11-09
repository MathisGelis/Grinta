import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "@/components/ui/AppModal";
import PressableScale from "@/components/ui/PressableScale";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import { GroupsService, type GroupSummary } from "@/services/groups.service";

type Props = {
  postId: string | null;
  onClose: () => void;
};

/** « Envoyer dans un groupe » : choix parmi `GET /groups`, `409` si déjà partagé. */
export default function SendToGroupSheet({ postId, onClose }: Props) {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    setGroups(null);
    GroupsService.list()
      .then((data) => !cancelled && setGroups(data))
      .catch((err) => {
        if (cancelled) return;
        setGroups([]);
        Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
      });
    return () => {
      cancelled = true;
    };
  }, [postId, t]);

  const send = async (group: GroupSummary) => {
    if (!postId || sendingTo) return;
    try {
      setSendingTo(group.id);
      await GroupsService.share(group.id, postId);
      onClose();
      Alert.alert(group.name, t.grpSent);
    } catch (err) {
      // Le serveur renvoie `409` avec un message lisible si le post est déjà dans le groupe.
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <Modal
      isVisible={!!postId}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={{ justifyContent: "flex-end" }}
    >
      <View className="max-h-[70%] rounded-t-hero bg-surface px-5 pb-8 pt-3">
        <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-raised" />
        <Text className="mb-4 text-xl font-semibold text-ink">{t.grpSendTitle}</Text>
        {groups === null ? (
          <ActivityIndicator color={WorkoutTheme.accent.purple} />
        ) : groups.length === 0 ? (
          <Text className="py-6 text-center text-sm text-ink-muted">{t.grpEmpty}</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-2">
            {groups.map((group) => (
              <PressableScale
                key={group.id}
                halo={false}
                disabled={!!sendingTo}
                onPress={() => send(group)}
                className="flex-row items-center gap-3 rounded-tile bg-raised p-4"
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                    {group.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-ink-muted">
                    {format(t.grpMemberCount, { n: group.memberCount })}
                  </Text>
                </View>
                {sendingTo === group.id ? (
                  <ActivityIndicator color={WorkoutTheme.accent.purple} />
                ) : (
                  <Ionicons name="paper-plane-outline" size={20} color={WorkoutTheme.accent.purple} />
                )}
              </PressableScale>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
