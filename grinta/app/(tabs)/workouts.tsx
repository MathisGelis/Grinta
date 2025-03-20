import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import BottomBar from './bottomBar';

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: string;
  restTime: string;
  image: string;
  completed?: boolean;
}

interface Workout {
  id: number;
  name: string;
  author: {
    name: string;
    image: string;
    location: string;
  };
  duration: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  calories: number;
  equipment: string[];
  description: string;
  exercises: Exercise[];
}

export default function WorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentExercise, setCurrentExercise] = useState<number | null>(null);
  
  const workout: Workout = {
    id: 1,
    name: "Pecs Epaules",
    author: {
      name: "Thomas Dupuis",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      location: "Lyon, France"
    },
    duration: "1h 45min",
    difficulty: "Intermédiaire",
    calories: 300,
    equipment: ["Haltères", "Banc de musculation", "Barre de traction"],
    description: "Un entraînement complet pour développer vos pectoraux et vos épaules. Ce programme combine des exercices composés et des exercices d'isolation pour maximiser l'hypertrophie musculaire.",
    exercises: [
      {
        id: 1,
        name: "Développé couché haltères",
        sets: 4,
        reps: "10-12",
        restTime: "90 sec",
        image: "https://images.unsplash.com/photo-1571019113664-8a70d82d31a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
      },
      {
        id: 2,
        name: "Élévations latérales",
        sets: 3,
        reps: "12-15",
        restTime: "60 sec",
        image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
      },
      {
        id: 3,
        name: "Dips",
        sets: 4,
        reps: "8-10",
        restTime: "90 sec",
        image: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
      },
      {
        id: 4,
        name: "Élévations frontales",
        sets: 3,
        reps: "12-15",
        restTime: "60 sec",
        image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
      },
      {
        id: 5,
        name: "Pompes déclinées",
        sets: 3,
        reps: "10-12",
        restTime: "60 sec",
        image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
      },
      {
        id: 6,
        name: "Face pull",
        sets: 3,
        reps: "15-20",
        restTime: "60 sec",
        image: "https://images.unsplash.com/photo-1597452485677-d661670d9640?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
      }
    ]
  };

  const toggleExercise = (index: number) => {
    if (currentExercise === index) {
      setCurrentExercise(null);
    } else {
      setCurrentExercise(index);
    }
  };

  const startWorkout = () => {
    router.push(`/active-workout/${workout.id}`);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.coverImageContainer}>
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1571388208497-71bedc66e932?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }} 
            style={styles.coverImage}
          />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerContainer}>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          
          <View style={styles.authorContainer}>
            <Image source={{ uri: workout.author.image }} style={styles.authorImage} />
            <View>
              <Text style={styles.authorName}>{workout.author.name}</Text>
              <Text style={styles.authorLocation}>{workout.author.location}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{workout.duration}</Text>
            <Text style={styles.metricLabel}>Durée</Text>
          </View>
          
          <View style={styles.metricDivider} />
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{workout.difficulty}</Text>
            <Text style={styles.metricLabel}>Difficulté</Text>
          </View>
          
          <View style={styles.metricDivider} />
          
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{workout.calories} kcal</Text>
            <Text style={styles.metricLabel}>Calories</Text>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Équipement</Text>
          <View style={styles.equipmentContainer}>
            {workout.equipment.map((item, index) => (
              <View key={index} style={styles.equipmentItem}>
                <Text style={styles.equipmentText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{workout.description}</Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Exercices</Text>
          
          {workout.exercises.map((exercise, index) => (
            <TouchableOpacity 
              key={exercise.id} 
              style={styles.exerciseCard}
              onPress={() => toggleExercise(index)}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets} séries • {exercise.reps} répétitions • {exercise.restTime} repos
                  </Text>
                </View>
                <Text style={styles.exerciseToggle}>
                  {currentExercise === index ? '−' : '+'}
                </Text>
              </View>
              
              {currentExercise === index && (
                <View style={styles.exerciseDetails}>
                  <Image 
                    source={{ uri: exercise.image }} 
                    style={styles.exerciseImage} 
                    resizeMode="cover"
                  />
                  <View style={styles.setsContainer}>
                    {Array(exercise.sets).fill(0).map((_, setIndex) => (
                      <View key={setIndex} style={styles.setItem}>
                        <Text style={styles.setText}>Série {setIndex + 1}</Text>
                        <Text style={styles.repText}>{exercise.reps} reps</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.startButtonContainer}>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={startWorkout}
        >
          <Text style={styles.startButtonText}>COMMENCER L'ENTRAÎNEMENT</Text>
        </TouchableOpacity>
      </View>
      
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollView: {
    flex: 1,
    marginBottom: 70,
  },
  coverImageContainer: {
    position: 'relative',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerContainer: {
    padding: 20,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  authorLocation: {
    fontSize: 14,
    color: '#777777',
  },
  metricsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#777777',
  },
  metricDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#EEEEEE',
    marginHorizontal: 10,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  equipmentItem: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  equipmentText: {
    color: '#333333',
    fontSize: 14,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555555',
  },
  exerciseCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#777777',
  },
  exerciseToggle: {
    fontSize: 24,
    color: '#8A2BE2',
    width: 30,
    textAlign: 'center',
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    marginBottom: 15,
  },
  setsContainer: {
    padding: 15,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  setText: {
    fontSize: 14,
    color: '#333333',
  },
  repText: {
    fontSize: 14,
    color: '#8A2BE2',
    fontWeight: '600',
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
  },
  startButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});