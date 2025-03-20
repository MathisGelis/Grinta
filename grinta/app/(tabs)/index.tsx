import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, StatusBar, Dimensions, Platform } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = Dimensions.get('window');

  return (
    <View style={styles.outerContainer}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5' }}
        style={[styles.backgroundImage, { width, height }]}
        resizeMode="cover"
      >
        <View style={styles.gradientOverlay}>
          <View style={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>G</Text>
            </View>
            
            <Text style={styles.title}>GRINTA</Text>
            <Text style={styles.slogan}>Dépassez vos limites</Text>
            
            <View style={styles.featuresContainer}>
              <Text style={styles.featureText}>• 📱 Un assistant fitness intelligent</Text>
              <Text style={styles.featureText}>• 👥 Une communauté motivante</Text>
              <Text style={styles.featureText}>• 💎 Un suivi ultra-personnalisé</Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={() => router.push("/register")}
              >
                <Text style={styles.primaryButtonText}>COMMENCER</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => router.push("/login")}
              >
                <Text style={styles.secondaryButtonText}>Se connecter</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.footerText}>
              Rejoignez plus de 10 000 athlètes
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 4,
  },
  slogan: {
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 40,
    opacity: 0.9,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  featureText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginVertical: 6,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#8A2BE2",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
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
    borderRadius: 30,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  footerText: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.7,
    marginTop: 20,
  }
});