import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "auth_token";

export const TokenService = {
  async save(token: string) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async get(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  async remove() {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },
};
