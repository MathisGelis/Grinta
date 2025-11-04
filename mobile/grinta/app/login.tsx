import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ImageBackground, Dimensions, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { width, height } = Dimensions.get('window');

  const handleLogin = () => {
    alert("Connexion réussie !");
    router.push("/profile");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>G</Text>
            </View>
            
            <Text style={styles.title}>CONNEXION</Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Votre adresse email" 
                  placeholderTextColor="#FFFFFF80"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Votre mot de passe" 
                  placeholderTextColor="#FFFFFF80"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleLogin}
              >
                <Text style={styles.primaryButtonText}>SE CONNECTER</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => router.back()}
              >
                <Text style={styles.secondaryButtonText}>Retour</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.signupLink}>S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#FFFFFF50",
    borderRadius: 10,
    paddingHorizontal: 15,
    color: "#FFFFFF",
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 16,
  },
  forgotPassword: {
    color: '#FFFFFF',
    textAlign: 'right',
    fontSize: 14,
    marginTop: 5,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#8A2BE2",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signupText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  signupLink: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: 'bold',
  }
});