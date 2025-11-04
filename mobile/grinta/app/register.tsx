import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ImageBackground, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { width, height } = Dimensions.get('window');

  const handleRegister = () => {
    alert("Inscription réussie !");
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardView}
            >
              <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.contentContainer}>
                  <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>G</Text>
                  </View>
                  
                  <Text style={styles.title}>INSCRIPTION</Text>
                  
                  <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="Votre nom d'utilisateur" 
                        placeholderTextColor="#FFFFFF80"
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                      />
                    </View>
                    
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
                        placeholder="Créez un mot de passe" 
                        placeholderTextColor="#FFFFFF80"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="Confirmez votre mot de passe" 
                        placeholderTextColor="#FFFFFF80"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                    
                    <Text style={styles.termsText}>
                      En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                    </Text>
                  </View>
                  
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                      style={styles.primaryButton} 
                      onPress={handleRegister}
                    >
                      <Text style={styles.primaryButtonText}>S'INSCRIRE</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.secondaryButton} 
                      onPress={() => router.back()}
                    >
                      <Text style={styles.secondaryButtonText}>Retour</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Déjà un compte ? </Text>
                    <TouchableOpacity onPress={() => router.push("/login")}>
                      <Text style={styles.loginLink}>Se connecter</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </ImageBackground>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  cardContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: '100%',
    height: '100%',
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
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
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
  termsText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
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
  loginContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  loginLink: {
    color: '#8A2BE2',
    fontSize: 14,
    fontWeight: 'bold',
  }
});