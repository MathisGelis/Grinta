import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { FormField, TextField } from "@/components/ui/FormField";
import PressableScale from "@/components/ui/PressableScale";
import { WorkoutTheme } from "@/constants/Colors";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  maxLength?: number;
};

/** Champ mot de passe : même style que les autres champs, avec bouton afficher / masquer. */
export default function PasswordField({ label, value, onChangeText, maxLength }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <FormField label={label}>
      <TextField
        icon="lock-closed-outline"
        placeholder="••••••••"
        secureTextEntry={!visible}
        value={value}
        maxLength={maxLength}
        onChangeText={onChangeText}
        textContentType="oneTimeCode"
        right={
          <PressableScale
            halo={false}
            bounce={false}
            hitSlop={12}
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
          >
            <Ionicons
              name={visible ? "eye" : "eye-off"}
              size={20}
              color={WorkoutTheme.text.tertiary}
            />
          </PressableScale>
        }
      />
    </FormField>
  );
}
