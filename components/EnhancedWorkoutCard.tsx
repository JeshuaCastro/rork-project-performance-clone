import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import ExerciseCard from '@/components/ExerciseCard';
import { WorkoutExercise } from '@/types/exercises';
import { parseWorkoutToExercises, getTargetRPE } from '@/utils/exerciseParser';
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react-native';

interface Workout {
  day: string;
  title: string;
  description: string;
  intensity: string;
  type: 'cardio' | 'strength' | 'recovery' | 'other';
}

interface EnhancedWorkoutCardProps {
  workout: Workout;
  isCompleted?: boolean;
  onStart?: () => void;
  onEdit?: () => void;
  onDetails?: () => void;
}

export default function EnhancedWorkoutCard({ 
  workout, 
  isCompleted = false, 
  onStart, 
  onEdit, 
  onDetails 
}: EnhancedWorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  // Parse the workout into structured exercises
  const exercises = parseWorkoutToExercises(workout.title, workout.description);
  
  // Add RPE and additional context to exercises
  const enhancedExercises: WorkoutExercise[] = exercises.map(exercise => ({
    ...exercise,
    targetRPE: getTargetRPE(workout.intensity),
    notes: exercise.notes || `${workout.intensity} intensity ${workout.type} exercise`,
  }));

  const handleExerciseStart = (exerciseId: string) => {
    console.log(`Starting exercise: ${exerciseId}`);
    // Here you could navigate to a detailed exercise view or start a timer
  };

  const handleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises(prev => [...prev, exerciseId]);
    console.log(`Completed exercise: ${exerciseId}`);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high': return colors.danger;
      case 'medium-high': return colors.warning;
      case 'medium': return colors.primary;
      case 'medium-low':
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const allExercisesCompleted = enhancedExercises.every(ex => 
    completedExercises.includes(ex.exerciseId)
  );

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      {/* Workout Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Dumbbell size={20} color={colors.primary} />
          <View style={styles.titleText}>
            <Text style={styles.workoutTitle}>{workout.title}</Text>
            <View style={styles.metaInfo}>
              <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(workout.intensity) + '20' }]}>
                <Text style={[styles.intensityText, { color: getIntensityColor(workout.intensity) }]}>
                  {workout.intensity}
                </Text>
              </View>
              <Text style={styles.workoutType}>{workout.type}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 
            <ChevronUp size={20} color={colors.textSecondary} /> : 
            <ChevronDown size={20} color={colors.textSecondary} />
          }
        </TouchableOpacity>
      </View>

      {/* Workout Description */}
      <Text style={styles.workoutDescription}>{workout.description}</Text>

      {/* Exercise Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Exercises: {completedExercises.length}/{enhancedExercises.length} completed
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(completedExercises.length / enhancedExercises.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!allExercisesCompleted ? (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={onStart}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedButton}>
            <Text style={styles.completedButtonText}>✓ Completed</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.detailsButtonText}>
            {isExpanded ? 'Hide' : 'Show'} Exercises
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expanded Exercise List */}
      {isExpanded && (
        <View style={styles.exerciseList}>
          <Text style={styles.exerciseListTitle}>Exercise Breakdown</Text>
          <ScrollView style={styles.exerciseScrollView} nestedScrollEnabled>
            {enhancedExercises.map((exercise, index) => (
              <ExerciseCard
                key={`${exercise.exerciseId}-${index}`}
                workoutExercise={exercise}
                isCompleted={completedExercises.includes(exercise.exerciseId)}
                onStart={() => handleExerciseStart(exercise.exerciseId)}
                onComplete={() => handleExerciseComplete(exercise.exerciseId)}
                showDetails={true}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  completedCard: {
    borderColor: colors.success + '30',
    backgroundColor: colors.success + '05',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    marginLeft: 12,
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 2,
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workoutType: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  expandButton: {
    padding: 4,
  },
  workoutDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  completedButton: {
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  completedButtonText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 16,
    marginTop: 4,
  },
  exerciseListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  exerciseScrollView: {
    maxHeight: 400, // Limit height to prevent excessive scrolling
  },
});