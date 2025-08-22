import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '@/constants/colors';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import EnhancedWorkoutCard from '@/components/EnhancedWorkoutCard';
import ExerciseCard from '@/components/ExerciseCard';
import { WorkoutExercise } from '@/types/exercises';

export default function ExerciseClarityDemo() {
  // Sample workout data
  const sampleWorkout = {
    day: 'Monday',
    title: 'Upper Body Strength',
    description: 'Push-ups 3x8-12, Dumbbell Rows 3x8-10, Plank hold 3x30-60 seconds. Focus on proper form and controlled movements.',
    intensity: 'Medium-High',
    type: 'strength' as const,
  };

  // Sample individual exercises
  const sampleExercises: WorkoutExercise[] = [
    {
      exerciseId: 'push-up',
      sets: 3,
      reps: '8-12',
      weight: 'bodyweight',
      restTime: '60 seconds',
      targetRPE: 7,
      notes: 'Focus on full range of motion and controlled tempo'
    },
    {
      exerciseId: 'squat',
      sets: 4,
      reps: 12,
      weight: 'bodyweight',
      restTime: '90 seconds',
      targetRPE: 6,
      notes: 'Keep chest up and knees tracking over toes'
    },
    {
      exerciseId: 'burpee',
      sets: 3,
      reps: 8,
      restTime: '2 minutes',
      targetRPE: 8,
      notes: 'High intensity - maintain form over speed'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{
          title: 'Exercise Clarity Demo',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <StatusBar style="light" />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enhanced Exercise Clarity</Text>
          <Text style={styles.subtitle}>
            Making workouts accessible for beginners with detailed instructions, 
            form tips, and progressive modifications.
          </Text>
        </View>

        {/* Enhanced Workout Card Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Enhanced Workout Card</Text>
          <Text style={styles.sectionDescription}>
            Workouts now break down into individual exercises with detailed guidance:
          </Text>
          <EnhancedWorkoutCard 
            workout={sampleWorkout}
            onStart={() => console.log('Starting workout')}
          />
        </View>

        {/* Individual Exercise Cards Demo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Individual Exercise Cards</Text>
          <Text style={styles.sectionDescription}>
            Each exercise provides comprehensive guidance for proper execution:
          </Text>
          
          {sampleExercises.map((exercise, index) => (
            <ExerciseCard
              key={`${exercise.exerciseId}-${index}`}
              workoutExercise={exercise}
              onStart={() => console.log(`Starting ${exercise.exerciseId}`)}
              showDetails={true}
            />
          ))}
        </View>

        {/* Features Overview */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>✨ Key Features</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📖</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Step-by-Step Instructions</Text>
                <Text style={styles.featureDescription}>
                  Detailed breakdown of each exercise with numbered steps, tips, and common mistakes to avoid.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚖️</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Progressive Modifications</Text>
                <Text style={styles.featureDescription}>
                  Easier and harder variations for every exercise, allowing users to progress at their own pace.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Clear Exercise Prescription</Text>
                <Text style={styles.featureDescription}>
                  Sets, reps, weight, rest time, and target RPE clearly displayed for each exercise.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚠️</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Safety Guidelines</Text>
                <Text style={styles.featureDescription}>
                  Important safety notes and form cues to prevent injury and ensure proper execution.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏷️</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Equipment & Difficulty</Text>
                <Text style={styles.featureDescription}>
                  Clear indication of required equipment and difficulty level for each exercise.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Progress Tracking</Text>
                <Text style={styles.featureDescription}>
                  Visual progress indicators and completion tracking for workouts and individual exercises.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Implementation Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>🚀 Benefits for Beginners</Text>
          
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>
              • <Text style={styles.benefitText}>Reduces intimidation factor for new exercisers</Text>
            </Text>
            <Text style={styles.benefitItem}>
              • <Text style={styles.benefitText}>Prevents injury through proper form education</Text>
            </Text>
            <Text style={styles.benefitItem}>
              • <Text style={styles.benefitText}>Enables progressive skill development</Text>
            </Text>
            <Text style={styles.benefitItem}>
              • <Text style={styles.benefitText}>Builds confidence through clear guidance</Text>
            </Text>
            <Text style={styles.benefitItem}>
              • <Text style={styles.benefitText}>Improves workout adherence and results</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  featuresList: {
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
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
  benefitsSection: {
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  benefitsList: {
    marginTop: 16,
  },
  benefitItem: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 12,
    lineHeight: 24,
  },
  benefitText: {
    color: colors.text,
  },
});