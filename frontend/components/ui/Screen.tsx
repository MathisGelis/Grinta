import React from "react";
import { ScrollView, View, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const FLOATING_HEADER_OFFSET = 12 + 44 + 12;

export const TAB_BAR_SPACE = 72 + 16;

type ScreenProps = ScrollViewProps & {
  scroll?: boolean;
  tabBar?: boolean;
  topInset?: boolean;
  className?: string;
};

export default function Screen({
  scroll = true,
  tabBar = true,
  topInset = true,
  className = "",
  children,
  contentContainerStyle,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = (topInset ? insets.top : 0) + 12;
  const paddingBottom = (tabBar ? TAB_BAR_SPACE : 16) + insets.bottom;

  return (
    <View className="flex-1">
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          {...rest}
          contentContainerStyle={[
            { paddingTop, paddingBottom },
            contentContainerStyle,
          ]}
          contentContainerClassName={`px-5 gap-6 ${className}`}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          className={`flex-1 px-5 ${className}`}
          style={{ paddingTop, paddingBottom }}
        >
          {children}
        </View>
      )}
    </View>
  );
}
