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

// Sample workout data - these should match to specific exercises with proper images
const sampleWorkouts = [
  {
    day: 'Monday',
    title: 'Upper Body',
    description: 'Bench Press and upper body accessories',
    intensity: 'Medium',
    type: 'strength' as const,
  },
  {
    day: 'Tuesday', 
    title: 'Deadlift Focus',
    description: 'Deadlift 4x5, back work',
    intensity: 'High',
    type: 'strength' as const,
  },
  {
    day: 'Wednesday',
    title: 'Push Day',
    description: 'Chest, shoulders, triceps - bench press, overhead press, dips, tricep work',
    intensity: 'Medium-High',
    type: 'strength' as const,
  },
  {
    day: 'Thursday',
    title: 'Lower Body',
    description: 'Squats, deadlifts, lunges, hip thrusts, and calf raises',
    intensity: 'High',
    type: 'strength' as const,
  },
  {
    day: 'Friday',
    title: 'Full Body',
    description: 'Full body strength training focusing on compound movements: squats, deadlifts, bench press, rows, and overhead press',
    intensity: 'Medium',
    type: 'strength' as const,
  },
  {
    day: 'Saturday',
    title: 'HIIT Cardio',
    description: 'High intensity interval training with jumping jacks, mountain climbers, and burpees',
    intensity: 'High',
    type: 'cardio' as const,
  },
];

// Sample individual exercises - these should show proper demonstration images
const sampleExercises: WorkoutExercise[] = [
  {
    exerciseId: 'bench-press',
    sets: 4,
    reps: 8,
    weight: '135 lbs',
    restTime: '2 minutes',
    targetRPE: 7,
    notes: 'Focus on controlled descent and explosive press',
  },
  {
    exerciseId: 'deadlift',
    sets: 5,
    reps: 5,
    weight: '185 lbs',
    restTime: '3 minutes',
    targetRPE: 8,
    notes: 'Keep bar close to body, drive through heels',
  },
  {
    exerciseId: 'squat',
    sets: 4,
    reps: 10,
    weight: 'bodyweight',
    restTime: '90 seconds',
    targetRPE: 6,
    notes: 'Keep chest up and drive through heels',
  },
  {
    exerciseId: 'overhead-press',
    sets: 3,
    reps: '8-10',
    weight: '95 lbs',
    restTime: '2 minutes',
    targetRPE: 7,
    notes: 'Keep core tight, press straight up',
  },
  {
    exerciseId: 'dumbbell-row',
    sets: 3,
    reps: 12,
    weight: '40 lbs',
    restTime: '90 seconds',
    targetRPE: 6,
    notes: 'Pull with back muscles, squeeze shoulder blades',
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
                  These cards automatically parse workout descriptions and match them to specific exercises with proper demonstration images. Tap &ldquo;Show Exercises&rdquo; to see the parsed breakdown.
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
                  Each exercise shows the correct demonstration image from Unsplash that matches the actual exercise being performed. Tap &ldquo;Tap to see form&rdquo; for detailed instructions.
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