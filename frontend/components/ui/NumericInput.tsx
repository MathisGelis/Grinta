import React, { useEffect, useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { WorkoutTheme } from "@/constants/Colors";

type Props = Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> & {
  value: number;
  onValueChange: (value: number) => void;
  decimal?: boolean;
  min?: number;
};

const format = (value: number) => (Number.isFinite(value) ? String(value) : "0");

export default function NumericInput({
  value,
  onValueChange,
  decimal = false,
  min = 0,
  onBlur,
  onSubmitEditing,
  ...rest
}: Props) {
  const [text, setText] = useState(format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(format(value));
  }, [value, focused]);

  const handleChange = (input: string) => {
    const cleaned = decimal
      ? input.replace(",", ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
      : input.replace(/[^0-9]/g, "");
    setText(cleaned);
    const parsed = decimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
    onValueChange(Number.isNaN(parsed) ? min : Math.max(min, parsed));
  };

  const commit = () => {
    const parsed = decimal ? parseFloat(text) : parseInt(text, 10);
    const next = Number.isNaN(parsed) ? min : Math.max(min, parsed);
    setText(format(next));
    onValueChange(next);
  };

  return (
    <TextInput
      {...rest}
      value={text}
      onChangeText={handleChange}
      keyboardType={decimal ? "decimal-pad" : "number-pad"}
      selectTextOnFocus
      placeholderTextColor={WorkoutTheme.text.tertiary}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        setFocused(false);
        commit();
        onBlur?.(event);
      }}
      onSubmitEditing={(event) => {
        commit();
        onSubmitEditing?.(event);
      }}
    />
  );
}
