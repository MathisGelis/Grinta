import React, { useState } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";

type OutlinedFieldProps = TextInputProps & {
  label: string;
  required?: boolean;
};

/** Champ texte dont le titre est inscrit dans la bordure; la bordure devient violette au focus. */
export function OutlinedField({
  label,
  required,
  multiline,
  onFocus,
  onBlur,
  style,
  ...rest
}: OutlinedFieldProps) {
  const [focused, setFocused] = useState(false);
  const color = focused ? WorkoutTheme.accent.purple : WorkoutTheme.border;

  return (
    <View style={{ marginTop: 8 }}>
      <View
        style={{
          borderWidth: focused ? 2 : 1,
          borderColor: color,
          borderRadius: multiline ? 20 : 28,
          paddingHorizontal: focused ? 19 : 20,
          paddingVertical: multiline ? (focused ? 15 : 16) : 0,
          minHeight: multiline ? 110 : 56,
          justifyContent: "center",
        }}
      >
        <TextInput
          placeholderTextColor={WorkoutTheme.text.tertiary}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              color: WorkoutTheme.text.primary,
              fontSize: 16,
              paddingVertical: 0,
              ...(multiline
                ? { minHeight: 78, textAlignVertical: "top" as const }
                : { height: 54 }),
            },
            style,
          ]}
          {...rest}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -9,
          left: 16,
          paddingHorizontal: 6,
          backgroundColor: WorkoutTheme.background,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: focused ? WorkoutTheme.accent.purple : WorkoutTheme.text.tertiary,
          }}
        >
          {label}
          {required ? <Text style={{ color: WorkoutTheme.status.danger }}> *</Text> : null}
        </Text>
      </View>
    </View>
  );
}
