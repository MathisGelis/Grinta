import AsyncStorage from "@react-native-async-storage/async-storage";
import { runSessionResets } from "@/core/services/sessionReset";

const KEPT_KEYS = ["app_language", "units", "hasSeenWelcome", "hasSeenOnboarding"];
const KEPT_PREFIX = "pending_";

/** Efface tout ce qui appartient au compte connecté (jeton, séance en cours, caches). */
export async function clearUserSession(): Promise<void> {
  runSessionResets();
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((key) => !KEPT_KEYS.includes(key) && !key.startsWith(KEPT_PREFIX)));
  } catch (error) {
    console.error("Error clearing user session:", error);
  }
}
