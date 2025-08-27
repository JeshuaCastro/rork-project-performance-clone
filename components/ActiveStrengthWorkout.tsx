import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import { Dumbbell, CheckCircle2, Clock, TrendingUp, RotateCcw, Plus, Minus } from 'lucide-react-native';
import { useWorkoutSession } from '@/store/workoutSessionStore';
import ActiveWorkoutBase from './ActiveWorkoutBase';
import { WorkoutSet, TrackedWorkoutExercise } from '@/types/exercises';

interface ActiveStrengthWorkoutProps {
  workoutTitle: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function ActiveStrengthWorkout({
  workoutTitle,
  onComplete,
  onCancel
}: ActiveStrengthWorkoutProps) {
  const {
    currentSession,
    currentExercise,
    currentSet,
    completeCurrentSet,
    moveToNextSet,
    getRecommendedWeight,
    getExerciseHistory,
    workoutProgress,
    completeWorkoutSession
  } = useWorkoutSession();

  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [currentReps, setCurrentReps] = useState<string>('');
  const [currentRPE, setCurrentRPE] = useState<string>('');
  const [setNotes, setSetNotes] = useState<string>('');

  // Timer for workout duration
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      const startTime = new Date(currentSession.startTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  // Rest timer
  useEffect(() => {
    if (!isResting || restTimer <= 0) return;

    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  // Load recommended values when exercise changes
  useEffect(() => {
    if (!currentExercise || !currentSet) return;

    const recommendedWeight = getRecommendedWeight(currentExercise.exerciseId);
    if (recommendedWeight) {
      setCurrentWeight(recommendedWeight.toString());
    }

    // Reset form
    setCurrentReps(currentSet.targetReps?.toString() || '');
    setCurrentRPE('');
    setSetNotes('');
  }, [currentExercise, currentSet, getRecommendedWeight]);

  const exerciseHistory = useMemo(() => {
    if (!currentExercise) return [];
    return getExerciseHistory(currentExercise.exerciseId).slice(-3);
  }, [currentExercise, getExerciseHistory]);

  const handleCompleteSet = () => {
    if (!currentWeight || !currentReps) {
      Alert.alert('Missing Data', 'Please enter weight and reps for this set.');
      return;
    }

    const weight = parseFloat(currentWeight);
    const reps = parseInt(currentReps);
    const rpe = currentRPE ? parseInt(currentRPE) : undefined;

    if (isNaN(weight) || isNaN(reps)) {
      Alert.alert('Invalid Data', 'Please enter valid numbers for weight and reps.');
      return;
    }

    completeCurrentSet(reps, weight, rpe, setNotes);

    // Start rest timer if there's a target rest time
    if (currentSet?.restTime) {
      setRestTimer(currentSet.restTime);
      setIsResting(true);
    }

    // Check if workout is complete
    if (workoutProgress && 
        workoutProgress.completedSets + 1 >= workoutProgress.totalSets) {
      setTimeout(() => {
        completeWorkoutSession();
        onComplete?.();
      }, 1000);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const adjustWeight = (delta: number) => {
    const current = parseFloat(currentWeight) || 0;
    const newWeight = Math.max(0, current + delta);
    setCurrentWeight(newWeight.toString());
  };

  const adjustReps = (delta: number) => {
    const current = parseInt(currentReps) || 0;
    const newReps = Math.max(0, current + delta);
    setCurrentReps(newReps.toString());
  };

  if (!currentSession || !currentExercise || !currentSet) {
    return (
      <ActiveWorkoutBase
        workoutTitle={workoutTitle}
        workoutType="strength"
        elapsedTime={elapsedTime}
        onCancel={onCancel}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active workout session</Text>
        </View>
      </ActiveWorkoutBase>
    );
  }

  const progressHeader = (
    <View style={styles.progressHeader}>
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Exercise {(currentSession.currentExerciseIndex + 1)} of {currentSession.exercises.length}
        </Text>
        <Text style={styles.progressSubtext}>
          Set {(currentSession.currentSetIndex + 1)} of {currentExercise.sets.length}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${((workoutProgress?.completedSets || 0) / (workoutProgress?.totalSets || 1)) * 100}%` 
            }
          ]} 
        />
      </View>
    </View>
  );

  return (
    <ActiveWorkoutBase
      workoutTitle={workoutTitle}
      workoutType="strength"
      elapsedTime={elapsedTime}
      customHeader={progressHeader}
      onCancel={onCancel}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Rest Timer */}
        {isResting && (
          <View style={styles.restTimerContainer}>
            <View style={styles.restTimerContent}>
              <Clock size={24} color={colors.warning} />
              <Text style={styles.restTimerText}>
                Rest: {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
              </Text>
              <TouchableOpacity style={styles.skipRestButton} onPress={handleSkipRest}>
                <Text style={styles.skipRestText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Current Exercise */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <View style={styles.exerciseIconContainer}>
              <Dumbbell size={20} color={colors.primary} />
            </View>
            <View style={styles.exerciseTitleContainer}>
              <Text style={styles.exerciseTitle}>{currentExercise.exerciseId}</Text>
              <Text style={styles.setInfo}>
                Set {currentSession.currentSetIndex + 1} of {currentExercise.sets.length}
              </Text>
            </View>
          </View>

          {/* Target vs Previous */}
          <View style={styles.targetContainer}>
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>Target</Text>
              <Text style={styles.targetValue}>
                {currentSet.targetReps} reps @ {currentSet.targetWeight || 'BW'}
              </Text>
            </View>
            {exerciseHistory.length > 0 && (
              <View style={styles.targetItem}>
                <Text style={styles.targetLabel}>Last Time</Text>
                <Text style={styles.targetValue}>
                  {exerciseHistory[exerciseHistory.length - 1].sets[0]?.actualReps || '-'} reps @ {exerciseHistory[exerciseHistory.length - 1].sets[0]?.actualWeight || '-'}
                </Text>
              </View>
            )}
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <View style={styles.inputWithButtons}>
                <TouchableOpacity 
                  style={styles.adjustButton} 
                  onPress={() => adjustWeight(-2.5)}
                >
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity 
                  style={styles.adjustButton} 
                  onPress={() => adjustWeight(2.5)}
                >
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <View style={styles.inputWithButtons}>
                <TouchableOpacity 
                  style={styles.adjustButton} 
                  onPress={() => adjustReps(-1)}
                >
                  <Minus size={16} color={colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  value={currentReps}
                  onChangeText={setCurrentReps}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity 
                  style={styles.adjustButton} 
                  onPress={() => adjustReps(1)}
                >
                  <Plus size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RPE (1-10)</Text>
              <TextInput
                style={styles.input}
                value={currentRPE}
                onChangeText={setCurrentRPE}
                keyboardType="numeric"
                placeholder="Optional"
                placeholderTextColor={colors.textSecondary}
                maxLength={2}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={setNotes}
              onChangeText={setSetNotes}
              placeholder="How did this set feel?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Complete Set Button */}
          <TouchableOpacity 
            style={styles.completeSetButton}
            onPress={handleCompleteSet}
          >
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.completeSetText}>Complete Set</Text>
          </TouchableOpacity>
        </View>

        {/* Exercise History */}
        {exerciseHistory.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={styles.historyTitle}>Recent Performance</Text>
            </View>
            {exerciseHistory.map((performance, index) => (
              <View key={performance.sessionId} style={styles.historyItem}>
                <Text style={styles.historyDate}>{performance.date}</Text>
                <Text style={styles.historyData}>
                  {performance.sets.length} sets • {performance.totalVolume} lbs total
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Completed Sets */}
        <View style={styles.completedSetsCard}>
          <Text style={styles.completedSetsTitle}>Completed Sets</Text>
          {currentExercise.sets.map((set, index) => (
            <View 
              key={index} 
              style={[
                styles.setRow,
                set.completed && styles.completedSetRow,
                index === currentSession.currentSetIndex && styles.currentSetRow
              ]}
            >
              <Text style={styles.setNumber}>{index + 1}</Text>
              <Text style={styles.setTarget}>
                {set.targetReps} × {set.targetWeight || 'BW'}
              </Text>
              {set.completed ? (
                <Text style={styles.setActual}>
                  {set.actualReps} × {set.actualWeight} {set.actualRPE ? `@ ${set.actualRPE}` : ''}
                </Text>
              ) : (
                <Text style={styles.setPending}>Pending</Text>
              )}
              {set.completed && (
                <CheckCircle2 size={16} color={colors.success} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </ActiveWorkoutBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressHeader: {
    padding: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  progressSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.ios.quaternaryBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  restTimerContainer: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  restTimerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restTimerText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  skipRestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skipRestText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  exerciseCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseTitleContainer: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  setInfo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  targetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  targetItem: {
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 8,
    overflow: 'hidden',
  },
  adjustButton: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ios.tertiaryBackground,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.ios.secondaryBackground,
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: colors.ios.secondaryBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  completeSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  completeSetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.ios.separator,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyData: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500' as const,
  },
  completedSetsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  completedSetsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  completedSetRow: {
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
  },
  currentSetRow: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    width: 24,
  },
  setTarget: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: 12,
  },
  setActual: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  setPending: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
});