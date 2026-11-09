import React from "react";
import { Text, type TextProps } from "react-native";
import { router } from "expo-router";
import type { PostPartner } from "@/services/user.service";

type Props = TextProps & {
  text: string;
  /** Seuls les `@pseudo` présents ici sont fiables et cliquables. */
  partners?: PostPartner[];
  userProfilePath?: string;
};

const MENTION = /(@[A-Za-z0-9_.]+)/g;

/** Rend le texte d'une séance en liant uniquement les `@pseudo` identifiés par le serveur. */
export default function MentionText({
  text,
  partners = [],
  userProfilePath = "/(tabs)/explore/user-profile",
  ...rest
}: Props) {
  const byName = new Map(partners.map((p) => [p.uniqueName.toLowerCase(), p]));
  const parts = text.split(MENTION);

  return (
    <Text {...rest}>
      {parts.map((part, i) => {
        if (!part.startsWith("@")) return part;
        // Un point final ne fait pas partie du pseudo (« merci @paul. »).
        const trailing = part.match(/\.+$/)?.[0] ?? "";
        const name = part.slice(1, part.length - trailing.length).toLowerCase();
        const partner = byName.get(name);
        if (!partner) return part;
        return (
          <React.Fragment key={i}>
            <Text
              className="font-semibold text-accent-light"
              accessibilityRole="link"
              onPress={() =>
                router.push({
                  pathname: userProfilePath as any,
                  params: { userId: partner.id },
                })
              }
            >
              {part.slice(0, part.length - trailing.length)}
            </Text>
            {trailing}
          </React.Fragment>
        );
      })}
    </Text>
  );
}
