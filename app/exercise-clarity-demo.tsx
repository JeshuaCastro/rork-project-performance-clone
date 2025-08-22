import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { ChevronLeft, Dumbbell, Activity, Heart } from 'lucide-react-native';
import EnhancedWorkoutCard from '@/components/EnhancedWorkoutCard';
import ExerciseCard from '@/components/ExerciseCard';
import { WorkoutExercise } from '@/types/exercises';

// Sample workout data
const sampleWorkouts = [
  {
    day: 'Monday',
    title: 'Upper Body Push',
    description: 'Bench Press 5x5, Incline DB Press 3x8-10, Shoulder Press 3x8-10, Triceps work',
    intensity: 'High',
    type: 'strength' as const,
  },
  {
    day: 'Tuesday',
    title: 'HIIT Cardio',
    description: '30 seconds work, 30 seconds rest x 10 exercises, 3 rounds. Focus on explosive movements.',
    intensity: 'High',
    type: 'cardio' as const,
  },
  {
    day: 'Wednesday',
    title: 'Full Body Strength',
    description: 'Circuit: Squats, Push-ups, Rows, Lunges, Planks (3 rounds). Perfect for beginners.',
    intensity: 'Medium',
    type: 'strength' as const,
  },
  {
    day: 'Thursday',
    title: 'Active Recovery',
    description: '30-45 minute walk or light yoga. Focus on mobility and gentle movement.',
    intensity: 'Low',
    type: 'recovery' as const,
  },
];

// Sample individual exercises
const sampleExercises: WorkoutExercise[] = [
  {
    exerciseId: 'push-up',
    sets: 3,
    reps: '8-12',
    targetRPE: 7,
    notes: 'Focus on proper form and controlled movement',
  },
  {
    exerciseId: 'squat',
    sets: 4,
    reps: 10,
    targetRPE: 8,
    notes: 'Keep chest up and drive through heels',
  },
  {
    exerciseId: 'plank',
    sets: 3,
    duration: '30-45 seconds',
    targetRPE: 6,
    notes: 'Maintain straight line from head to heels',
  },
];

export default function ExerciseClarityDemo() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'workouts' | 'exercises'>('workouts');
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>([]);

  const handleWorkoutStart = (workoutTitle: string) => {
    console.log(`Starting workout: ${workoutTitle}`);
    // Simulate workout completion after a short delay
    setTimeout(() => {
      setCompletedWorkouts(prev => [...prev, workoutTitle]);
    }, 2000);
  };

  const handleExerciseStart = (exerciseId: string) => {
    console.log(`Starting exercise: ${exerciseId}`);
  };

  const handleExerciseComplete = (exerciseId: string) => {
    console.log(`Completed exercise: ${exerciseId}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exercise Clarity Demo</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'workouts' && styles.activeTab,
            ]}
            onPress={() => setSelectedTab('workouts')}
          >
            <Dumbbell size={16} color={selectedTab === 'workouts' ? colors.text : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'workouts' && styles.activeTabText,
              ]}
            >
              Enhanced Workouts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'exercises' && styles.activeTab,
            ]}
            onPress={() => setSelectedTab('exercises')}
          >
            <Activity size={16} color={selectedTab === 'exercises' ? colors.text : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'exercises' && styles.activeTabText,
              ]}
            >
              Individual Exercises
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedTab === 'workouts' ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Enhanced Workout Cards</Text>
                <Text style={styles.sectionDescription}>
                  These cards automatically parse workout descriptions and provide detailed exercise breakdowns with step-by-step instructions.
                </Text>
              </View>

              {sampleWorkouts.map((workout, index) => (
                <EnhancedWorkoutCard
                  key={index}
                  workout={workout}
                  isCompleted={completedWorkouts.includes(workout.title)}
                  onStart={() => handleWorkoutStart(workout.title)}
                  onEdit={() => console.log('Edit workout:', workout.title)}
                  onDetails={() => console.log('View details:', workout.title)}
                />
              ))}
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Individual Exercise Cards</Text>
                <Text style={styles.sectionDescription}>
                  Each exercise card provides comprehensive guidance including form tips, modifications, and safety notes.
                </Text>
              </View>

              {sampleExercises.map((exercise, index) => (
                <ExerciseCard
                  key={index}
                  workoutExercise={exercise}
                  onStart={() => handleExerciseStart(exercise.exerciseId)}
                  onComplete={() => handleExerciseComplete(exercise.exerciseId)}
                  showDetails={true}
                />
              ))}
            </>
          )}

          {/* Features Overview */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Key Features</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Dumbbell size={20} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Comprehensive Exercise Database</Text>
                <Text style={styles.featureDescription}>
                  Detailed instructions, form tips, modifications, and safety notes for every exercise.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Activity size={20} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Smart Workout Parsing</Text>
                <Text style={styles.featureDescription}>
                  Automatically converts workout descriptions into structured, actionable exercise plans.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Heart size={20} color={colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Beginner-Friendly Design</Text>
                <Text style={styles.featureDescription}>
                  Clear visual cues, difficulty levels, and progressive modifications for all fitness levels.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});