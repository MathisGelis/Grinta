import React, { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Modal from "@/components/ui/AppModal";
import Button from "@/components/ui/Button";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { format } from "@/i18n/translations";
import type { Badge } from "@/services/badges.service";
import BadgeList from "./BadgeList";

type Props = {
  badges: Badge[];
  visible: boolean;
  onClose: () => void;
};

/** « Nouveau record ! » affiché après l'enregistrement d'une séance, sans requête supplémentaire. */
export default function NewRecordsSheet({ badges, visible, onClose }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [visible]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={{ justifyContent: "flex-end" }}
    >
      <View className="max-h-[85%] rounded-t-hero bg-surface px-5 pb-8 pt-3">
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-raised" />
        <View className="mb-5 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-accent-tint">
            <Ionicons name="trophy" size={38} color={WorkoutTheme.accent.purple} />
          </View>
          <Text className="mt-4 text-2xl font-semibold text-ink">{t.newRecord}</Text>
          <Text className="mt-1 text-sm text-ink-muted">
            {format(t.recordsBroken, { n: badges.length })}
          </Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
          <BadgeList badges={badges} />
        </ScrollView>
        <Button label={t.continueBtn} onPress={onClose} className="mt-2" />
      </View>
    </Modal>
  );
}
