import { navigate } from "expo-router/build/global-state/routing";
import { AuthService } from "@/services/auth.service";
import { TokenService } from "@/services/token.service";
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setInfoMessage("Veuillez remplir tous les champs");
      return;
    }

    try {
      setLoading(true);
      const response = await AuthService.login(email, password);
      await TokenService.save(response.access_token);
    } catch (err: any) {
      setInfoMessage(err.message);
    } finally {
      setLoading(false);
      navigate("/explore");
    }
  };

  return (
    <View className="flex-1 justify-center p-5 bg-black">
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <Text className="text-white text-base font-bold">← Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-white mb-8 text-center">
        Login to Grinta
      </Text>

      <TextInput
        className="bg-slate-800 text-white rounded-lg p-3 mb-4"
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        className="bg-slate-800 text-white rounded-lg p-3 mb-4"
        placeholder="Password"
        secureTextEntry
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
      />

      {infoMessage && (
        <Text className="text-white font-bold text-center mb-4">
          {infoMessage}
        </Text>
      )}

      <TouchableOpacity
        className="bg-purple-600 p-4 rounded-lg mt-3 items-center"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-white text-base font-bold">
          {loading ? "Connexion..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
