import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, StatusBar, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import BottomBar from '../(tabs)/bottomBar';

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = Dimensions.get('window');

  const friends = [
    { id: 1, image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' },
    { id: 2, image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' },
    { id: 3, image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' },
    { id: 4, image: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' },
  ];

  const gallery = [
    { id: 1, image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
    { id: 2, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
    { id: 3, image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
    { id: 4, image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
  ];

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView}>
        <ImageBackground 
          source={require('../../assets/images/purplewave.jpg')} 
          style={styles.headerBackground}
          resizeMode="cover"
        />
        
        <View style={styles.profileCardContainer}>
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' }}
                style={styles.profileImage}
              />
            </View>
            
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileBio}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Phasellus quis tempor metus. Nunc convallis efficitur blandit. 
              Nulla at sapien sit amet nulla dapibus maximus. Ut bibendum 
              fringilla ex.
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.messageButton}>
                <Text style={styles.messageButtonText}>✈️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.statsBarWrapper}>
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>456</Text>
                <Text style={styles.statLabel}>Training</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>67</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>70</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.mainContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Friends</Text>
              <View style={styles.friendsList}>
                {friends.map(friend => (
                  <TouchableOpacity key={friend.id} style={styles.friendItem}>
                    <Image source={{ uri: friend.image }} style={styles.friendImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <View style={styles.galleryGrid}>
                {gallery.map(item => (
                  <TouchableOpacity key={item.id} style={styles.galleryItem}>
                    <Image source={{ uri: item.image }} style={styles.galleryImage} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  headerBackground: {
    height: 150,
    width: '100%',
  },
  profileCardContainer: {
    paddingHorizontal: 16,
    marginTop: -75,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: -50,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileBio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    borderRadius: 50,
    marginRight: 10,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8E2F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    marginTop: 20,
    paddingLeft: 15, // Ajout d'un padding à gauche pour éviter que la barre violet soit collée
    paddingBottom: 20, // Ajout d'un padding en bas pour éviter que le contenu soit caché par la barre de navigation
  },
  statsBarWrapper: {
    marginRight: 15, // Ajoute une marge à droite de la barre
  },
  statsBar: {
    width: 80, // Réduit la largeur de 100 à 80
    backgroundColor: '#8A2BE2',
    borderRadius: 15, // Coins arrondis sur tous les côtés
    paddingVertical: 20,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginVertical: 12, // Réduit légèrement la marge verticale
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 22, // Légèrement plus petit
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 12, // Légèrement plus petit
    opacity: 0.8,
  },
  statDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    marginVertical: 12,
  },
  mainContent: {
    flex: 1,
    paddingRight: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  friendsList: {
    flexDirection: 'row',
  },
  friendItem: {
    marginRight: 10,
  },
  friendImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  galleryItem: {
    width: '50%',
    padding: 5,
    aspectRatio: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  }
});