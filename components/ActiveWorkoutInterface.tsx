import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { colors } from '@/constants/colors';
import { X, Pause, Play, CheckCircle2, SkipForward, AlertTriangle } from 'lucide-react-native';
import { useWorkoutSession } from '@/store/workoutSessionStore';
import SetTrackerComponent from './SetTrackerComponent';
import ProgressiveOverloadDisplay from './ProgressiveOverloadDisplay';
import WorkoutTimer from './WorkoutTimer';
import { ExerciseDefinition } from '@/types/exercises';

interface ActiveWorkoutInterfaceProps {
  exerciseDefinitions: Record<string, ExerciseDefinition>;
  onClose: () => void;
}

export default function ActiveWorkoutInterface({ 
  exerciseDefinitions, 
  onClose 
}: ActiveWorkoutInterfaceProps) {
  const {
    currentSession,
    currentExercise,
    currentSet,
    workoutProgress,
    isWorkoutActive,
    isWorkoutPaused,
    completeCurrentSet,
    pauseWorkoutSession,
    resumeWorkoutSession,
    completeWorkoutSession,
    cancelWorkoutSession,
    getExerciseHistory,
    moveToNextSet
  } = useWorkoutSession();

  const [showTimer, setShowTimer] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  // Track workout duration
  useEffect(() => {
    if (!currentSession || !isWorkoutActive) return;

    const interval = setInterval(() => {
      const startTime = new Date(currentSession.startTime).getTime();
      const now = new Date().getTime();
      setWorkoutDuration(Math.floor((now - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, isWorkoutActive]);

  const currentExerciseDefinition = exerciseDefinitions[currentExercise?.exerciseId ?? ''];
  const isCardio = useMemo(() => {
    const primary = currentExerciseDefinition?.primaryMuscles ?? [];
    const equip = currentExerciseDefinition?.equipment ?? [];
    const hasDuration = Boolean(currentExercise?.duration);
    return primary.includes('cardio') || equip.includes('cardio-equipment') || hasDuration;
  }, [currentExerciseDefinition, currentExercise?.duration]);

  const exerciseHistory = currentExercise ? getExerciseHistory(currentExercise.exerciseId) : [];
  const lastPerformance = exerciseHistory.length > 0 ? exerciseHistory[exerciseHistory.length - 1] : undefined;

  if (!currentSession || !currentExercise || (!currentSet && !isCardio)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color={colors.danger} />
          <Text style={styles.errorText}>No active workout session</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetComplete = (actualReps: number, actualWeight?: number, actualRPE?: number, notes?: string) => {
    completeCurrentSet(actualReps, actualWeight, actualRPE, notes);
    setShowTimer(true);
  };

  const handlePauseResume = () => {
    if (isWorkoutPaused) {
      resumeWorkoutSession();
    } else {
      pauseWorkoutSession();
    }
  };

  const handleCompleteWorkout = () => {
    Alert.alert(
      'Complete Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            completeWorkoutSession();
            onClose();
          }
        }
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? All progress will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => {
            cancelWorkoutSession();
            onClose();
          }
        }
      ]
    );
  };

  const handleSkipSet = () => {
    Alert.alert(
      'Skip Set',
      'Skip this set and move to the next one?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            moveToNextSet();
            setShowTimer(false);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancelWorkout}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{currentSession.workoutTitle ?? 'Active Workout'}</Text>
          <Text style={styles.workoutDuration}>{formatDuration(workoutDuration)}</Text>
        </View>
        
        <TouchableOpacity style={styles.headerButton} onPress={handlePauseResume}>
          {isWorkoutPaused ? (
            <Play size={24} color={colors.primary} />
          ) : (
            <Pause size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {workoutProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${(workoutProgress.completedSets / workoutProgress.totalSets) * 100}%` 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {workoutProgress.completedSets}/{workoutProgress.totalSets} sets • {workoutProgress.completedExercises}/{workoutProgress.totalExercises} exercises
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Exercise Info */}
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>
            {currentSession.exerciseNameMap?.[currentExercise.exerciseId] || currentExerciseDefinition?.name || currentExercise.exerciseId}
          </Text>
          <Text style={styles.exerciseProgress}>
            Exercise {(currentSession.currentExerciseIndex || 0) + 1} of {currentSession.exercises.length}
          </Text>
        </View>

        {/* Strength: Progressive Overload Display; Cardio: Cardio panel */}
        {isCardio ? (
          <View style={styles.cardioContainer} testID="cardio-panel">
            <View style={styles.cardioHeaderRow}>
              <Text style={styles.cardioTitle}>Cardio Session</Text>
              <Text style={styles.cardioBadge}>Endurance</Text>
            </View>
            <View style={styles.cardioStatsRow}>
              <View style={styles.cardioStat}>
                <Text style={styles.cardioStatLabel}>Elapsed</Text>
                <Text style={styles.cardioStatValue}>{formatDuration(workoutDuration)}</Text>
              </View>
              {currentExercise.restTime ? (
                <View style={styles.cardioStat}>
                  <Text style={styles.cardioStatLabel}>Target</Text>
                  <Text style={styles.cardioStatValue}>{currentExercise.restTime}</Text>
                </View>
              ) : null}
              {currentExerciseDefinition?.caloriesPerMinute ? (
                <View style={styles.cardioStat}>
                  <Text style={styles.cardioStatLabel}>Cal/min</Text>
                  <Text style={styles.cardioStatValue}>{currentExerciseDefinition.caloriesPerMinute}</Text>
                </View>
              ) : null}
            </View>
            {currentExerciseDefinition?.description ? (
              <Text style={styles.cardioDescription}>{currentExerciseDefinition.description}</Text>
            ) : null}
          </View>
        ) : currentSet ? (
          <ProgressiveOverloadDisplay
            exerciseId={currentExercise.exerciseId}
            exerciseName={currentExerciseDefinition?.name || currentExercise.exerciseId}
            history={exerciseHistory}
            currentTargets={{
              reps: currentSet.targetReps,
              weight: currentSet.targetWeight,
              rpe: currentSet.targetRPE
            }}
          />
        ) : null}

        {/* Rest Timer - strength only */}
        {!isCardio && showTimer && (
          <WorkoutTimer
            defaultRestTime={parseInt(currentExercise.restTime?.replace(/\D/g, '') || '90')}
            onTimerComplete={() => setShowTimer(false)}
            autoStart={true}
          />
        )}

        {/* Set Tracker - strength only */}
        {!isCardio && currentSet && (
          <SetTrackerComponent
            currentSet={currentSet}
            setNumber={currentSet.setNumber}
            exerciseId={currentExercise.exerciseId}
            previousPerformance={lastPerformance ? {
              weight: lastPerformance.sets[currentSet.setNumber - 1]?.actualWeight,
              reps: lastPerformance.sets[currentSet.setNumber - 1]?.actualReps,
              rpe: lastPerformance.sets[currentSet.setNumber - 1]?.actualRPE
            } : undefined}
            onSetComplete={handleSetComplete}
          />
        )}

        {/* Exercise Instructions */}
        {currentExerciseDefinition && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Exercise Instructions</Text>
            <Text style={styles.instructionsText}>
              {currentExerciseDefinition.description}
            </Text>
            
            {currentExerciseDefinition.formTips.length > 0 && (
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Form Tips:</Text>
                {currentExerciseDefinition.formTips.slice(0, 2).map((tip, index) => (
                  <Text key={index} style={styles.tipText}>• {tip}</Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkipSet}
        >
          <SkipForward size={20} color={colors.textSecondary} />
          <Text style={styles.skipButtonText}>Skip Set</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.completeWorkoutButton}
          onPress={handleCompleteWorkout}
        >
          <CheckCircle2 size={20} color="#FFFFFF" />
          <Text style={styles.completeWorkoutButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    borderBottomColor: 'rgba(93, 95, 239, 0.1)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  workoutDuration: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.card,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  exerciseHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  exerciseProgress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  instructionsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  tipsContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardioContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardioTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  cardioBadge: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: 'rgba(93, 95, 239, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardioStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardioStat: {
    flex: 1,
    alignItems: 'center',
  },
  cardioStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardioStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  cardioDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(93, 95, 239, 0.1)',
  },
  skipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  completeWorkoutButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  completeWorkoutButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});