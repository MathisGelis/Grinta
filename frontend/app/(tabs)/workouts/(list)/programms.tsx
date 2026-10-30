import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { chromeScrollProps } from "@/components/ui/chromeScroll";
import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomOffset } from "@/hooks/useKeyboardOffset";
import { useFocusEffect } from "expo-router";
import { programmsList, SmallProgramm } from "@/services/programms.service";
import ProgrammCard from "@/components/workout/programmes/ProgrammCard";
import { useSectionQuery } from "@/contexts/WorkoutsSearchContext";
import { normalizeText } from "@/utils/text";

import { useTranslation } from "@/contexts/LanguageContext";
export default function ProgramsScreen() {
  const { t } = useTranslation();
  const bottomOffset = useBottomOffset();
  const [programms, setProgramms] = useState<SmallProgramm[]>(
    () => programmsList.peek() ?? [],
  );
  const [loading, setLoading] = useState(() => programmsList.peek() === null);
  const [error, setError] = useState<string | null>(null);
  const query = useSectionQuery("programmes");
  const deferredQuery = useDeferredValue(query);

  const loadProgramms = useCallback(async () => {
    try {
      setError(null);
      setProgramms(await programmsList.load());
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadingError);
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadProgramms();
    }, [loadProgramms]),
  );

  useEffect(() => {
    programmsList.set(programms);
  }, [programms]);

  const data = useMemo(() => {
    const needle = normalizeText(deferredQuery.trim());
    return needle
      ? programms.filter((p) => normalizeText(p.title).includes(needle))
      : programms;
  }, [programms, deferredQuery]);

  const handleUpdate = useCallback((updated: SmallProgramm) => {
    setProgramms((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setProgramms((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SmallProgramm }) => (
      <ProgrammCard program={item} onUpdate={handleUpdate} onDelete={handleDelete} />
    ),
    [handleUpdate, handleDelete],
  );

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-muted">{t.loadingProgrammes}</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-danger">{error}</Text>
        </View>
      ) : data.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-ink-muted">{t.noProgrammeFound}</Text>
        </View>
      ) : (
        <FlatList {...chromeScrollProps}
          data={data}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: bottomOffset + 80 }}
        />
      )}
    </SafeAreaView>
  );
}
