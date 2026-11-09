import React from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutTheme } from "@/constants/Colors";

type FormFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  required,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <View className={`gap-2 ${className}`}>
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
};

export function TextField({
  icon,
  suffix,
  multiline,
  style,
  ...rest
}: TextFieldProps) {
  return (
    <View
      className={`flex-row bg-surface px-5 ${
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
    </View>
  );
}
