import { AuthService } from "@/services/auth.service";
import { TokenService } from "@/services/token.service";
import { navigate } from "expo-router/build/global-state/routing";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Mot de passe et confirmation ne correspondent pas");
      return;
    }
    try {
      setLoading(true);
      const response = await AuthService.register(email, password, name);
      await TokenService.save(response.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      navigate("/explore");
    }

    setError("");
    navigate("/explore");
  };

  return (
    <View className="flex-1 justify-center p-5 bg-black">
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <Text className="text-white text-base font-bold">← Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-white mb-8 text-center">
        Create your Grinta account 💪
      </Text>

      <TextInput
        className="bg-slate-800 text-white rounded-lg p-3 mb-4"
        placeholder="Name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />

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

      <TextInput
        className="bg-slate-800 text-white rounded-lg p-3 mb-4"
        placeholder="Confirm Password"
        secureTextEntry
        placeholderTextColor="#aaa"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error && (
        <Text className="text-white font-bold text-center mb-4">{error}</Text>
      )}

      <TouchableOpacity
        className="bg-purple-600 p-4 rounded-lg mt-3 items-center"
        onPress={handleRegister}
        disabled={loading}
      >
        <Text className="text-white text-base font-bold">
          {loading ? "Connexion..." : "Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
