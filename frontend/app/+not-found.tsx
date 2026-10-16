import { router, Stack } from "expo-router";
import { Text, View } from "react-native";
import { useTranslation } from "@/contexts/LanguageContext";
import Button from "@/components/ui/Button";
import ScreenBackground from "@/components/ui/ScreenBackground";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center gap-8 px-5">
        <ScreenBackground />
        <Text className="text-center text-3xl font-semibold text-ink">
          {t.oops}
        </Text>
        <Button
          className="w-full"
          icon="home"
          label={t.goHome}
          onPress={() => router.replace("/")}
        />
      </View>
    </>
  );
}
