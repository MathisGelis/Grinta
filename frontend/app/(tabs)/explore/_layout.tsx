import { useEffect } from "react";
import { Stack, router, usePathname } from "expo-router";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchProvider, useSearch } from "@/contexts/SearchContext";
import { WorkoutTheme } from "@/constants/Colors";
import IconButton from "@/components/ui/IconButton";
import PressableScale from "@/components/ui/PressableScale";
import Glass from "@/components/ui/Glass";
import ScreenBackground from "@/components/ui/ScreenBackground";

import { useTranslation } from "@/contexts/LanguageContext";
const RIGHT_GROUP_WIDTH = 112;

function ExploreHeader() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isSearchPage = pathname.endsWith("/search");
  const { query, handleSearch, clearSearch } = useSearch();

  const handleBack = () => {
    clearSearch();
    router.back();
  };

  const progress = useSharedValue(isSearchPage ? 1 : 0);
  useEffect(() => {
    progress.set(
      withTiming(isSearchPage ? 1 : 0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [isSearchPage, progress]);

  const rightStyle = useAnimatedStyle(() => ({
    width: RIGHT_GROUP_WIDTH * (1 - progress.get()),
    opacity: 1 - progress.get(),
  }));

  return (
    <View
      className="absolute inset-x-0 top-0 z-10 px-5"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="flex-row items-center" style={{ height: 44 }}>
        <IconButton
          icon={isSearchPage ? "chevron-back" : "notifications-outline"}
          label={isSearchPage ? t.back : t.notifications}
          variant="glass"
          onPress={
            isSearchPage
              ? handleBack
              : () => router.push("/(tabs)/explore/notification")
          }
        />

        <PressableScale
          className="ml-3 flex-1"
          halo={isSearchPage ? false : "fill"}
          accessibilityRole="search"
          accessibilityLabel={t.searchLabel}
          disabled={isSearchPage}
          onPress={() => router.push("/(tabs)/explore/search")}
        >
          <Glass
            className="flex-row items-center gap-2 rounded-full px-4"
            style={{ height: 44 }}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={WorkoutTheme.text.tertiary}
            />
            {isSearchPage ? (
              <TextInput
                placeholder={t.searchUsersPlaceholder}
                placeholderTextColor={WorkoutTheme.text.tertiary}
                className="flex-1 py-0 text-[16px] text-ink"
                style={{ height: 44, textAlignVertical: "center" }}
                value={query}
                onChangeText={handleSearch}
                autoFocus
              />
            ) : (
              <Text
                className="flex-1 text-base text-ink-muted"
                style={{ textAlignVertical: "center" }}
              >
                {t.searchLabel}
              </Text>
            )}
          </Glass>
        </PressableScale>

        <Animated.View
          pointerEvents={isSearchPage ? "none" : "auto"}
          style={[{ overflow: "hidden" }, rightStyle]}
        >
          <View
            className="flex-row gap-3 pl-3"
            style={{ width: RIGHT_GROUP_WIDTH }}
          >
            <IconButton
              icon="people-outline"
              label={t.socialTitle}
              variant="glass"
              onPress={() => router.push("/(tabs)/social" as any)}
            />
            <IconButton
              icon="paper-plane-outline"
              label={t.chatLabel}
              variant="glass"
              onPress={() => router.push("/(tabs)/explore/chat")}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

export default function ExploreLayout() {
  const pathname = usePathname();

  const hideHeader =
    pathname.endsWith("/notification") ||
    pathname.endsWith("/chat") ||
    pathname.endsWith("/userPost") ||
    pathname.includes("/user-profile");

  return (
    <SearchProvider>
      <View className="flex-1">
        <ScreenBackground />
        {!hideHeader && <ExploreHeader />}

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="search"
            options={{ animation: "none", gestureEnabled: false }}
          />
          <Stack.Screen
            name="notification"
            options={{ animation: "slide_from_left" }}
          />
          <Stack.Screen name="chat" />
          <Stack.Screen name="userPost" />
        </Stack>
      </View>
    </SearchProvider>
  );
}
