import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import BottomBar from '../(tabs)/bottomBar';

const TargetMuscles = ({ muscles }: { muscles: string[] }) => {
  return (
    <View style={styles.bodyContainer}>
      <View style={styles.bodyOutline}>
        <View style={[styles.muscleFill, styles.chestMuscle]} />
        <View style={[styles.muscleFill, styles.shoulderMuscle]} />
      </View>
      <View style={styles.bodyOutline}>
        <View style={[styles.muscleFill, styles.backMuscle]} />
      </View>
    </View>
  );
};

const Pagination = ({ current, total }: { current: number, total: number }) => {
  return (
    <View style={styles.paginationContainer}>
      {Array(total).fill(0).map((_, i) => (
        <View 
          key={i} 
          style={[
            styles.paginationDot, 
            i === current ? styles.paginationDotActive : {}
          ]} 
        />
      ))}
    </View>
  );
};

interface WorkoutCardProps {
  workout: {
    id: number;
    name: string;
    targetMuscles: string[];
    authorName: string;
    authorLocation: string;
    authorImage: string;
    duration?: string;
    calories?: number;
    color?: string;
    streak?: number;
  };
}

const WorkoutCard = ({ workout }: WorkoutCardProps) => {
  return (
    <TouchableOpacity style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.authorContainer}>
          <Image source={{ uri: workout.authorImage }} style={styles.authorImage} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{workout.authorName}</Text>
            <Text style={styles.authorLocation}>{workout.authorLocation}</Text>
          </View>
        </View>
        {workout.streak && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakCount}>{workout.streak}</Text>
          </View>
        )}
      </View>
      
      <Text style={[
        styles.workoutName, 
        workout.color ? { color: workout.color } : {}
      ]}>
        {workout.name}
      </Text>
      
      {workout.duration && (
        <View style={styles.workoutStatsContainer}>
          <TargetMuscles muscles={workout.targetMuscles} />
          <View style={styles.workoutStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.duration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.calories} Kcal</Text>
              <Text style={styles.statLabel}>Calories burned</Text>
            </View>
          </View>
        </View>
      )}
      
      {workout.id === 2 && <Pagination current={0} total={3} />}
    </TouchableOpacity>
  );
};

export default function ExploreScreen() {
  const router = useRouter();
  
  const workouts = [
    {
      id: 1,
      name: "Arms",
      targetMuscles: ["biceps", "triceps"],
      authorName: "Chris Bumstead",
      authorLocation: "Ottawa, Canada",
      authorImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      streak: 3
    },
    {
      id: 2,
      name: "Pecs Epaules",
      targetMuscles: ["chest", "shoulders"],
      authorName: "Thomas Dupuis",
      authorLocation: "Lyon, France",
      authorImage: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      duration: "1h 45m",
      calories: 300,
      color: "#9370DB"
    },
    {
      id: 3,
      name: "Legs destroyer",
      targetMuscles: ["quads", "hamstrings", "calves"],
      authorName: "Marta Rodriguez",
      authorLocation: "Barcelone, Espagne",
      authorImage: "https://images.unsplash.com/photo-1594381898411-846e7d193883?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
      streak: 6,
      color: "#9370DB"
    }
  ];
  
  const filterOptions = [
    { id: 1, icon: "👍", count: 5 },
    { id: 2, icon: "+" }
  ];

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.headerIcon}>🔍</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.headerIcon}>💬</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {workouts.map(workout => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
        
        <View style={styles.filterContainer}>
          {filterOptions.map(option => (
            <TouchableOpacity key={option.id} style={styles.filterOption}>
              <Text style={styles.filterIcon}>{option.icon}</Text>
              {option.count && <Text style={styles.filterCount}>{option.count}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerIcon: {
    fontSize: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  authorInfo: {
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  authorLocation: {
    fontSize: 14,
    color: '#777777',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 18,
    marginRight: 5,
  },
  streakCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 10,
    marginBottom: 15,
  },
  workoutStatsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  bodyContainer: {
    flexDirection: 'row',
    width: '40%',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  bodyOutline: {
    height: 120,
    width: 35,
    borderColor: '#999999',
    borderWidth: 0.5,
    position: 'relative',
    marginHorizontal: 5,
    backgroundColor: '#FFFFFF',
  },
  muscleFill: {
    position: 'absolute',
    backgroundColor: '#FF6347',
    opacity: 0.7,
  },
  chestMuscle: {
    top: 20,
    left: 5,
    right: 5,
    height: 20,
    borderRadius: 10,
  },
  shoulderMuscle: {
    top: 10,
    left: 3,
    right: 3,
    height: 10,
    borderRadius: 5,
  },
  backMuscle: {
    top: 20,
    left: 5,
    right: 5,
    height: 25,
    borderRadius: 10,
  },
  workoutStats: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  statItem: {
    marginBottom: 15,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#777777',
  },
  statDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555555',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#9370DB',
    width: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  filterOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterIcon: {
    fontSize: 18,
  },
  filterCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#9370DB',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 20,
  }
});