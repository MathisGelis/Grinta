import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Modal from "@/components/ui/AppModal";
import PressableScale from "@/components/ui/PressableScale";
import SendToGroupSheet from "@/components/groups/SendToGroupSheet";
import ShareCardSheet, { type ShareCardData } from "@/components/share/ShareCardSheet";
import { buildPostShareData } from "@/components/share/postShareData";
import { WorkoutTheme } from "@/constants/Colors";
import { useTranslation } from "@/contexts/LanguageContext";
import { PostsService } from "@/services/posts.service";

type Props = {
  postId: string | null;
  onClose: () => void;
};

type Step = "menu" | "group" | "card" | null;

// Laisse la feuille du menu finir de se fermer avant d'en présenter une autre (iOS).
const HANDOFF_MS = 260;

/** « Partager » un post : choix entre l'envoyer dans un groupe ou en faire une card de partage. */
export default function PostShareMenu({ postId, onClose }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(null);
  const [cardData, setCardData] = useState<ShareCardData | null>(null);

  useEffect(() => {
    setStep(postId ? "menu" : null);
    if (!postId) setCardData(null);
  }, [postId]);

  const chooseGroup = () => {
    setStep(null);
    setTimeout(() => setStep("group"), HANDOFF_MS);
  };

  const chooseCard = async () => {
    if (!postId) return;
    setStep(null);
    try {
      const [detail, workout] = await Promise.all([
        PostsService.getPostById(postId),
        PostsService.getPostWorkout(postId),
      ]);
      if (!detail) throw new Error(t.cannotLoadPost);
      setCardData(buildPostShareData(detail, workout, t.completedWorkoutTitle));
      setTimeout(() => setStep("card"), HANDOFF_MS);
    } catch (err) {
      Alert.alert(t.error, err instanceof Error ? err.message : t.loadingError);
      onClose();
    }
  };

  const option = (icon: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void) => (
    <PressableScale
      halo={false}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-tile bg-raised px-4 py-4"
    >
      <Ionicons name={icon} size={20} color={WorkoutTheme.text.primary} />
      <Text className="flex-1 text-[15px] font-semibold text-ink">{label}</Text>
    </PressableScale>
  );

  return (
    <>
      <Modal
        isVisible={step === "menu"}
        onBackdropPress={onClose}
        onSwipeComplete={onClose}
        swipeDirection="down"
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="gap-2 rounded-t-hero bg-surface px-5 pb-8 pt-3">
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-raised" />
          <Text className="mb-2 text-xl font-semibold text-ink">{t.shrCard}</Text>
          {option("people-outline", t.grpSend, chooseGroup)}
          {option("albums-outline", t.shrCardTitle, chooseCard)}
        </View>
      </Modal>

      <SendToGroupSheet postId={step === "group" ? postId : null} onClose={onClose} />
      <ShareCardSheet visible={step === "card"} data={cardData} onClose={onClose} />
    </>
  );
}
