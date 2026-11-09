import React from "react";
import { Alert, Text, View } from "react-native";
import { useTranslation } from "@/contexts/LanguageContext";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";
import { isNotFound } from "@/services/api";
import { PostsService } from "@/services/posts.service";
import type { PostPartner } from "@/services/user.service";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";

type Props = {
  postId: string;
  partners?: PostPartner[];
  onDeclined?: (userId: string) => void;
  className?: string;
};

const MAX_AVATARS = 3;

/** « avec @paul, @julie » : avatars superposés, et « Me retirer » si l'utilisateur est identifié. */
export default function PostPartners({ postId, partners, onDeclined, className = "" }: Props) {
  const { t } = useTranslation();
  const meId = useCurrentUserId();

  if (!partners || partners.length === 0) return null;

  const isPartner = !!meId && partners.some((p) => p.id === meId);

  const decline = () => {
    if (!meId) return;
    Alert.alert(t.removeMeTitle, t.removeMeConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.removeMe,
        style: "destructive",
        onPress: async () => {
          try {
            await PostsService.declinePartner(postId);
            onDeclined?.(meId);
          } catch (error) {
            // « Vous n'êtes pas identifié sur ce post » : déjà retiré.
            if (isNotFound(error)) onDeclined?.(meId);
            else Alert.alert(t.error, error instanceof Error ? error.message : t.error);
          }
        },
      },
    ]);
  };

  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <View className="flex-row">
        {partners.slice(0, MAX_AVATARS).map((p, i) => (
          <View
            key={p.id}
            className="rounded-full border-2 border-surface"
            style={{ marginLeft: i === 0 ? 0 : -10 }}
          >
            <Avatar uri={p.avatarThumbnailUrl} name={p.displayName} size={28} />
          </View>
        ))}
      </View>
      <Text className="flex-1 text-xs text-ink-muted" numberOfLines={2}>
        {t.withPartners} {partners.map((p) => `@${p.uniqueName}`).join(", ")}
      </Text>
      {isPartner ? (
        <PressableScale
          onPress={decline}
          accessibilityRole="button"
          accessibilityLabel={t.removeMe}
          className="h-9 justify-center rounded-full bg-raised px-4"
        >
          <Text className="text-xs font-semibold text-ink-soft">{t.removeMe}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
