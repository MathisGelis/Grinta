import React from "react";
import { Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { WorkoutTheme } from "@/constants/Colors";

type FormFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function FormField({
  label,
  required,
  children,
  className = "",
  style,
}: FormFieldProps) {
  return (
    <View className={`gap-2 ${className}`} style={style}>
      <Text className="ml-4 text-sm text-ink-muted">
        {label}
        {required ? <Text className="text-danger"> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

type TextFieldProps = TextInputProps & {
  icon?: keyof typeof Ionicons.glyphMap;
  suffix?: string;
  /** Élément à droite du champ (ex. bouton afficher / masquer le mot de passe). */
  right?: React.ReactNode;
  /** Fond du champ : "raised" pour un champ posé sur une card. */
  tone?: "surface" | "raised";
};

export function TextField({
  icon,
  suffix,
  right,
  tone = "surface",
  multiline,
  style,
  ...rest
}: TextFieldProps) {
  return (
    <View
      className={`flex-row ${tone === "raised" ? "bg-raised" : "bg-surface"} px-5 ${
        multiline ? "rounded-tile py-4" : "h-14 items-center rounded-full"
      }`}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={WorkoutTheme.accent.purple}
          style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }}
        />
      )}
      <TextInput
        placeholderTextColor={WorkoutTheme.text.tertiary}
        multiline={multiline}
        className="flex-1 py-0 text-[16px] text-ink"
        style={[
          multiline
            ? { minHeight: 90, textAlignVertical: "top" }
            : { height: 56 },
          style,
        ]}
        {...rest}
      />
      {suffix ? (
        <Text className="ml-2 text-sm text-ink-muted">{suffix}</Text>
      ) : null}
      {right ? <View className="ml-2">{right}</View> : null}
    </View>
  );
}
