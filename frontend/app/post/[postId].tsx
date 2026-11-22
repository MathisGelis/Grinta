import { useEffect } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenBackground from "@/components/ui/ScreenBackground";
import { TokenService } from "@/services/token.service";

/**
 * Point d'entrée du lien de partage `grinta://post/<id>` : redirige vers la page du post
 * si l'utilisateur est connecté, sinon vers l'écran de démarrage.
 */
export default function PostLinkScreen() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;

  useEffect(() => {
    let cancelled = false;
    TokenService.get().then((token) => {
      if (cancelled) return;
      if (token && postId) {
        router.replace({ pathname: "/(tabs)/explore/userPost", params: { postId } });
      } else {
        router.replace("/");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  return (
    <View className="flex-1">
      <ScreenBackground />
    </View>
  );
}
