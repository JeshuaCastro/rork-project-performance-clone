import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';
import { ExerciseDefinition } from '@/types/exercises';
import { searchExercisesByKeywords, getCardioFallbackExercise } from '@/constants/exerciseDatabase';
import { Play, CheckCircle2, Eye, Clock, Activity, X, Heart } from 'lucide-react-native';

interface Workout {
  day: string;
  title: string;
  description: string;
  intensity: string;
  adjustedForRecovery?: string | null;
  type: 'cardio' | 'strength' | 'recovery' | 'other';
  completed?: boolean;
  duration?: string;
  equipment?: string[];
  exercises?: {
    name: string;
    sets?: string;
    reps?: string;
    duration?: string;
    notes?: string;
  }[];
  tips?: string[];
  modifications?: string[];
  targetHeartRate?: string;
  caloriesBurned?: string;
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
  const [showFormTips, setShowFormTips] = useState(false);
  
  // Get the primary exercise for this workout
  const getPrimaryExercise = (): ExerciseDefinition | null => {
    const titleLower = workout.title.toLowerCase();
    
    // Direct matches for common workout titles
    const directMatches: Record<string, string> = {
      'squat focus': 'back-squat',
      'back squat': 'back-squat',
      'bench press': 'bench-press',
      'upper body push': 'bench-press',
      'deadlift focus': 'deadlift',
      'deadlift': 'deadlift',
      'upper body pull': 'pull-up',
      'pull-ups': 'pull-up',
      'barbell rows': 'barbell-row',
      'rows': 'barbell-row',
      'overhead press': 'overhead-press',
      'shoulder press': 'overhead-press',
      'leg press': 'leg-press',
      'romanian deadlift': 'romanian-deadlift',
      'rdl': 'romanian-deadlift',
      'incline press': 'incline-dumbbell-press',
      'incline dumbbell press': 'incline-dumbbell-press',
      'face pulls': 'face-pull',
      'easy run': 'easy-run',
      'recovery run': 'easy-run',
      'long run': 'long-run',
      'tempo run': 'tempo-run',
      'tempo session': 'tempo-run',
      'speed work': 'interval-training',
      'interval training': 'interval-training',
      'intervals': 'interval-training',
      'steady state cycling': 'steady-state-cycling',
      'cycling intervals': 'cycling-intervals',
      'hiit cardio': 'burpee',
      'hiit session': 'burpee',
      'full body strength': 'squat',
      'strength circuit': 'push-up',
      'core': 'plank',
      'core work': 'plank',
      'mobility': 'plank'
    };
    
    // Check for direct matches first
    for (const [key, exerciseId] of Object.entries(directMatches)) {
      if (titleLower.includes(key)) {
        const exercises = searchExercisesByKeywords([exerciseId]);
        if (exercises.length > 0) return exercises[0];
      }
    }
    
    // Fallback to keyword search
    const keywords = titleLower.split(' ');
    const exercises = searchExercisesByKeywords(keywords);
    
    if (exercises.length > 0) {
      // Return best match based on type
      if (workout.type === 'strength') {
        return exercises.find(ex => ex.primaryMuscles.some(muscle => 
          ['chest', 'back', 'shoulders', 'legs', 'glutes', 'core', 'biceps', 'triceps'].includes(muscle)
        )) || exercises[0];
      } else if (workout.type === 'cardio') {
        return exercises.find(ex => ex.primaryMuscles.includes('cardio' as any)) || exercises[0];
      }
      return exercises[0];
    }
    
    return getCardioFallbackExercise(titleLower) || null;
  };
  
  const primaryExercise = getPrimaryExercise();
  
  // Get exercise image URL
  const getExerciseImageUrl = (): string => {
    if (primaryExercise?.demonstrationImageUrl) {
      return primaryExercise.demonstrationImageUrl;
    }
    
    // Fallback images based on workout type
    const fallbackImages = {
      strength: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
      cardio: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
      recovery: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop&crop=center&auto=format&q=80',
      other: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&crop=center&auto=format&q=80'
    };
    
    return fallbackImages[workout.type] || fallbackImages.other;
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
  
  // Suppress unused variables
  void onEdit;

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
          {/* Workout Title */}
          <View style={styles.overlayContent}>
            <Text style={styles.overlayTitle} numberOfLines={2}>
              {workout.title}
            </Text>
            
            {/* Key Metrics */}
            <View style={styles.keyMetrics}>
              {workout.duration && (
                <View style={styles.metricItem}>
                  <Clock size={14} color={colors.text} />
                  <Text style={styles.metricText}>{workout.duration}</Text>
                </View>
              )}
              <View style={styles.metricItem}>
                <Activity size={14} color={colors.text} />
                <Text style={styles.metricText}>{workout.type}</Text>
              </View>
            </View>
          </View>
          
          {/* Form Tips Button */}
          {primaryExercise && (
            <TouchableOpacity 
              style={styles.formTipsButton}
              onPress={() => setShowFormTips(true)}
            >
              <Eye size={16} color={colors.text} />
              <Text style={styles.formTipsButtonText}>Tap to see form</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Completion Badge */}
        {isCompleted && (
          <View style={styles.completionBadge}>
            <CheckCircle2 size={20} color={colors.success} />
          </View>
        )}
        
        {/* Intensity Badge */}
        <View style={[
          styles.intensityBadgeOverlay,
          { backgroundColor: getIntensityColor(workout.intensity) }
        ]}>
          <Text style={styles.intensityText}>{workout.intensity}</Text>
        </View>
      </View>

      {/* Workout Prescription */}
      <View style={styles.prescriptionContainer}>
        <Text style={styles.workoutDescription} numberOfLines={2} ellipsizeMode="tail">
          {workout.description}
        </Text>
        
        {/* Exercise Breakdown */}
        {workout.exercises && workout.exercises.length > 0 && (
          <View style={styles.exerciseBreakdown}>
            {workout.exercises.slice(0, 3).map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {[exercise.sets && `${exercise.sets} sets`, 
                    exercise.reps && `${exercise.reps} reps`,
                    exercise.duration && exercise.duration
                  ].filter(Boolean).join(' × ')}
                </Text>
              </View>
            ))}
            {workout.exercises.length > 3 && (
              <Text style={styles.moreExercises}>+{workout.exercises.length - 3} more exercises</Text>
            )}
          </View>
        )}
        

      </View>
      
      {/* Recovery Adjustment */}
      {workout.adjustedForRecovery && (
        <View style={styles.adjustmentContainer}>
          <Heart size={16} color={colors.warning} />
          <View style={styles.adjustmentContent}>
            <Text style={styles.adjustmentTitle}>Recovery Adjustment</Text>
            <Text style={styles.adjustmentText}>{workout.adjustedForRecovery}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isCompleted ? (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={onStart}
          >
            <Play size={16} color={colors.text} />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedButton}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={styles.completedButtonText}>Completed</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={onDetails}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>


      
      {/* Form Tips Modal */}
      <Modal
        visible={showFormTips}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFormTips(false)}
      >
        <View style={styles.formTipsOverlay}>
          <View style={styles.formTipsContent}>
            {primaryExercise && (
              <>
                <View style={styles.formTipsHeader}>
                  <Text style={styles.formTipsTitle}>Form Tips: {primaryExercise.name}</Text>
                  <TouchableOpacity 
                    style={styles.closeFormTipsButton}
                    onPress={() => setShowFormTips(false)}
                  >
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.formTipsScroll} showsVerticalScrollIndicator={false}>
                  {/* Exercise Image */}
                  <Image 
                    source={{ uri: primaryExercise.demonstrationImageUrl }}
                    style={styles.formTipsImage}
                    resizeMode="cover"
                  />
                  
                  {/* Form Tips */}
                  <View style={styles.formTipsList}>
                    {primaryExercise.formTips.map((tip: string, index: number) => (
                      <View key={index} style={styles.formTipItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.formTipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Common Mistakes */}
                  {primaryExercise.commonMistakes.length > 0 && (
                    <View style={styles.mistakesSection}>
                      <Text style={styles.mistakesTitle}>Common Mistakes to Avoid:</Text>
                      {primaryExercise.commonMistakes.slice(0, 3).map((mistake: string, index: number) => (
                        <View key={index} style={styles.mistakeItem}>
                          <View style={styles.warningBullet} />
                          <Text style={styles.mistakeText}>{mistake}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
                
                <TouchableOpacity 
                  style={styles.gotItButton}
                  onPress={() => setShowFormTips(false)}
                >
                  <Text style={styles.gotItButtonText}>Got it!</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  // Image Container Styles
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  overlayContent: {
    flex: 1,
    marginRight: 12,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  keyMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  formTipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  intensityBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  // Prescription Container Styles
  prescriptionContainer: {
    padding: 16,
    backgroundColor: colors.background,
  },

  workoutDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  exerciseBreakdown: {
    marginTop: 8,
    marginBottom: 12,
  },
  exerciseItem: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  exerciseDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moreExercises: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  adjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  adjustmentContent: {
    flex: 1,
  },
  adjustmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 4,
  },
  adjustmentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  startButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  completedButtonText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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

  // Form Tips Modal Styles
  formTipsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTipsContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  formTipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  formTipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  closeFormTipsButton: {
    padding: 4,
  },
  formTipsScroll: {
    flex: 1,
  },
  formTipsImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  formTipsList: {
    padding: 16,
    paddingTop: 0,
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
  mistakesSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mistakesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 12,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  warningBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
    marginTop: 8,
    marginRight: 12,
  },
  mistakeText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  gotItButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    margin: 16,
  },
  gotItButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});