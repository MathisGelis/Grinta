import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";
import { Programme } from "@/services/programme.service";
import { useState } from "react";
import Modal from "react-native-modal";
import SectionHeader from "@/components/ui/SectionHeader";
import PressableScale from "@/components/ui/PressableScale";
import Button from "@/components/ui/Button";

import { WorkoutTheme } from "@/constants/Colors";
import { format } from "@/i18n/translations";
type ProgrammeSectionProps = {
  programmes: Programme[];
};

export default function ProgrammeSection({
  programmes,
}: ProgrammeSectionProps) {
  const { t } = useTranslation();
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  function openProgrammeModal(programme: Programme) {
    setSelectedProgramme(programme);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setSelectedProgramme(null);
  }
  return (
    <>
      {programmes.length > 0 ? (
        <View className="gap-4">
          <SectionHeader title={t.workoutCategories} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-5"
            contentContainerClassName="gap-3 px-5"
          >
            {programmes.map((p) => (
              <PressableScale
                key={p.id}
                className="w-[190px] rounded-tile bg-surface p-4"
                onPress={() => openProgrammeModal(p)}
                accessibilityRole="button"
                accessibilityLabel={p.title}
              >
                <View className="mb-4 h-11 w-11 items-center justify-center rounded-full bg-accent-tint">
                  <Ionicons name="barbell-outline" size={22} color={WorkoutTheme.accent.purple} />
                </View>
                <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                  {p.title}
                </Text>
                <Text className="mt-0.5 text-xs text-ink-muted">
                  {format(t.workoutsCountLabel, { n: p.workouts?.length ?? 0 })}
                </Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View className="items-center gap-2 rounded-card bg-surface p-8">
          <Ionicons name="barbell-outline" size={40} color={WorkoutTheme.text.disabled} />
          <Text className="text-base font-semibold text-ink-muted">
            {t.noProgrammeAvailable}
          </Text>
          <Text className="text-center text-sm text-ink-faint">
            {t.createFirstProgramme}
          </Text>
        </View>
      )}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={closeModal}
        onSwipeComplete={closeModal}
        swipeDirection="down"
        propagateSwipe
        animationIn="slideInUp"
        animationOut="slideOutDown"
        useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="overflow-hidden rounded-t-hero bg-surface pb-6">
          <View className="mt-3 h-1.5 w-12 self-center rounded-full bg-raised" />
          {selectedProgramme && (
            <View className="items-center p-5">
              <Text className="mb-1.5 text-center text-lg font-bold text-ink">
                {selectedProgramme.title}
              </Text>
              {selectedProgramme.description && (
                <Text className="mb-3 text-center text-sm text-ink-soft">
                  {selectedProgramme.description}
                </Text>
              )}
              <Text className="mb-5 text-sm text-accent">
                {format(t.workoutsCountLabel, { n: selectedProgramme.workouts?.length ?? 0 })}
              </Text>
              <Button label={t.ok} onPress={closeModal} className="mb-2 w-full" />
              <PressableScale onPress={closeModal} className="py-2">
                <Text className="text-sm text-ink-soft">{t.cancel2}</Text>
              </PressableScale>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
