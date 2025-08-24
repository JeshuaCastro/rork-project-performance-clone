import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { WorkoutExercise } from '@/types/exercises';
import { getExerciseById } from '@/constants/exerciseDatabase';
import { 
  Play, 
  CheckCircle2,
  Eye
} from 'lucide-react-native';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  onStart?: () => void;
  onComplete?: () => void;
  isCompleted?: boolean;
  showDetails?: boolean;
}

export default function ExerciseCard({ 
  workoutExercise, 
  onStart, 
  onComplete, 
  isCompleted = false,
  showDetails = true 
}: ExerciseCardProps) {
  const [showFormTips, setShowFormTips] = useState(false);
  
  // Suppress unused variable warning for showDetails
  void showDetails;
  
  const exercise = getExerciseById(workoutExercise.exerciseId);
  
  if (!exercise) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>Exercise not found: {workoutExercise.exerciseId}</Text>
      </View>
    );
  }

  const formatSetsReps = () => {
    const parts = [];
    if (workoutExercise.sets) parts.push(`${workoutExercise.sets} sets`);
    if (workoutExercise.reps) parts.push(`${workoutExercise.reps} reps`);
    if (workoutExercise.duration) parts.push(workoutExercise.duration);
    return parts.join(' × ') || 'As prescribed';
  };

  // Get exercise demonstration image URL
  const getExerciseImageUrl = () => {
    // Use the demonstration image from the exercise database if available
    if (exercise.demonstrationImageUrl) {
      return exercise.demonstrationImageUrl;
    }
    
    // Create exercise-specific image URLs with proper search terms
    const exerciseImageMap: Record<string, string> = {
      'push-up': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person doing push-ups
      'squat': 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person doing squats
      'plank': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person in plank position
      'dumbbell-row': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person doing dumbbell rows
      'lunge': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person doing lunges
      'jumping-jacks': 'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person doing jumping jacks
      'mountain-climbers': 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person doing mountain climbers
      'burpee': 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person doing burpees
      'bench-press': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person bench pressing
      'deadlift': 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person deadlifting
      'overhead-press': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop&crop=center&auto=format&q=80', // Person doing overhead press
    };
    
    // Return exercise-specific image or fallback
    return exerciseImageMap[exercise.id] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center&auto=format&q=80';
  };

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      {/* Exercise Image with Overlay */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: getExerciseImageUrl() }}
          style={styles.exerciseImage}
          resizeMode="cover"
        />
        
        {/* Image Overlay */}
        <View style={styles.imageOverlay}>
          {/* Exercise Name */}
          <Text style={styles.exerciseName} numberOfLines={2}>
            {exercise.name}
          </Text>
          
          {/* Form Tips Button */}
          <TouchableOpacity 
            style={styles.formTipsButton}
            onPress={() => setShowFormTips(!showFormTips)}
          >
            <Eye size={16} color={colors.text} />
            <Text style={styles.formTipsButtonText}>Tap to see form</Text>
          </TouchableOpacity>
        </View>
        
        {/* Completion Badge */}
        {isCompleted && (
          <View style={styles.completionBadge}>
            <CheckCircle2 size={20} color={colors.success} />
          </View>
        )}
      </View>

      {/* Exercise Prescription */}
      <View style={styles.prescriptionContainer}>
        <Text style={styles.prescriptionText}>{formatSetsReps()}</Text>
        {workoutExercise.weight && (
          <Text style={styles.metricText}>Weight: {workoutExercise.weight}</Text>
        )}
        {workoutExercise.restTime && (
          <Text style={styles.metricText}>Rest: {workoutExercise.restTime}</Text>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.actionButton, isCompleted && styles.completedActionButton]}
        onPress={isCompleted ? onComplete : onStart}
        disabled={isCompleted}
        activeOpacity={isCompleted ? 1 : 0.7}
      >
        {isCompleted ? (
          <>
            <CheckCircle2 size={18} color={colors.success} />
            <Text style={[styles.actionButtonText, styles.completedActionText]}>Completed</Text>
          </>
        ) : (
          <>
            <Play size={18} color={colors.text} />
            <Text style={styles.actionButtonText}>Start</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Form Tips Overlay */}
      {showFormTips && (
        <View style={styles.formTipsOverlay}>
          <View style={styles.formTipsContent}>
            <Text style={styles.formTipsTitle}>Form Tips</Text>
            {exercise.formTips.slice(0, 3).map((tip, index) => (
              <View key={index} style={styles.formTipItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.formTipText}>{tip}</Text>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.closeTipsButton}
              onPress={() => setShowFormTips(false)}
            >
              <Text style={styles.closeTipsButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notes */}
      {workoutExercise.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{workoutExercise.notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.8,
  },
  errorCard: {
    backgroundColor: colors.danger + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  formTipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  formTipsButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  completionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
  },

  prescriptionContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },
  prescriptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  metricText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  completedActionButton: {
    backgroundColor: colors.success + '20',
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedActionText: {
    color: colors.success,
  },
  formTipsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  formTipsContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
  },
  formTipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  formTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  formTipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  closeTipsButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  closeTipsButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },

  notesContainer: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});