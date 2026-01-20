import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveItem = async (key: string, value: string) => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (e) {
        console.error("Error saving item:", e);
    }
};

export const getItem = async (key: string) => {
    try {
        return await AsyncStorage.getItem(key);
    } catch (e) {
        console.error("Error reading item:", e);
        return null;
    }
};

export const removeItem = async (key: string) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error("Error removing item:", e);
    }
};
