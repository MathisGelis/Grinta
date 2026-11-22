import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/contexts/LanguageContext";
import { Programme } from "@/services/programme.service";
import { useState } from "react";
import Modal from "react-native-modal";

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
        <>
          <View className="mx-4 mt-2 mb-3 flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-white">
              {t.workoutCategories}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 4,
            }}
          >
            {programmes.map((p) => (
              <TouchableOpacity
                key={p.id}
                className="mr-3 w-[180px] rounded-2xl bg-[#1a1a1a] p-4"
                activeOpacity={0.85}
                onPress={() => openProgrammeModal(p)}
              >
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-[14px] bg-[#2a1f4a]">
                  <Ionicons name="barbell-outline" size={28} color="#7B5CF0" />
                </View>
                <Text
                  className="mb-1 text-sm font-bold text-white"
                  numberOfLines={2}
                >
                  {p.title}
                </Text>
                <Text className="text-[12px] text-[#888]">
                  {p.workouts?.length ?? 0} workouts
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      ) : (
        <View className="mx-4 items-center gap-2 rounded-2xl bg-[#1a1a1a] px-8 py-8">
          <Ionicons name="barbell-outline" size={40} color="#444" />
          <Text className="text-base font-semibold text-[#888]">
            Aucun programme disponible
          </Text>
          <Text className="text-center text-[13px] text-[#555]">
            Créez votre premier programme pour commencer
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
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View className="overflow-hidden rounded-t-[24px] bg-[#17191d]">
          {selectedProgramme && (
            <View className="items-center p-5">
              <Text className="mb-1.5 text-center text-lg font-bold text-white">
                {selectedProgramme.title}
              </Text>
              {selectedProgramme.description && (
                <Text className="mb-3 text-center text-sm text-[#B9B7C8]">
                  {selectedProgramme.description}
                </Text>
              )}
              <Text className="mb-5 text-sm text-[#8B5CF6]">
                {selectedProgramme.workouts?.length ?? 0} workouts
              </Text>
              <TouchableOpacity
                className="mb-3 w-full items-center rounded-full bg-[#8B5CF6] px-12 py-3.5"
                onPress={closeModal}
              >
                <Text className="text-base font-bold text-white">OK</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal} className="py-2">
                <Text className="text-sm text-[#B9B7C8]">{t.cancel2}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
