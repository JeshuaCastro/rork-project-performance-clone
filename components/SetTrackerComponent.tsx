import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import { CheckCircle2, Edit3, Target, TrendingUp } from 'lucide-react-native';
import { WorkoutSet } from '@/types/exercises';
import { useWorkoutSession } from '@/store/workoutSessionStore';

interface SetTrackerComponentProps {
  currentSet: WorkoutSet;
  setNumber: number;
  exerciseId: string;
  previousPerformance?: {
    weight?: number;
    reps?: number;
    rpe?: number;
  };
  onSetComplete: (actualReps: number, actualWeight?: number, actualRPE?: number, notes?: string) => void;
}

export default function SetTrackerComponent({
  currentSet,
  setNumber,
  exerciseId,
  previousPerformance,
  onSetComplete
}: SetTrackerComponentProps) {
  const [actualReps, setActualReps] = useState<string>('');
  const [actualWeight, setActualWeight] = useState<string>('');
  const [actualRPE, setActualRPE] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  
  const { getRecommendedWeight } = useWorkoutSession();

  // Initialize with recommended or previous values
  useEffect(() => {
    const recommendedWeight = getRecommendedWeight(exerciseId);
    if (recommendedWeight && !actualWeight) {
      setActualWeight(recommendedWeight.toString());
    } else if (currentSet.targetWeight && !actualWeight) {
      setActualWeight(currentSet.targetWeight.toString());
    }
    
    if (currentSet.targetRPE && !actualRPE) {
      setActualRPE(currentSet.targetRPE.toString());
    }
  }, [exerciseId, currentSet, getRecommendedWeight, actualWeight, actualRPE]);

  const handleCompleteSet = () => {
    const reps = parseInt(actualReps);
    const weight = actualWeight ? parseFloat(actualWeight) : undefined;
    const rpe = actualRPE ? parseInt(actualRPE) : undefined;

    if (!reps || reps <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of reps');
      return;
    }

    if (rpe && (rpe < 1 || rpe > 10)) {
      Alert.alert('Invalid RPE', 'RPE should be between 1 and 10');
      return;
    }

    onSetComplete(reps, weight, rpe, notes || undefined);
    
    // Reset for next set
    setActualReps('');
    setNotes('');
    setIsEditing(false);
  };

  const getProgressIndicator = () => {
    if (!previousPerformance) return null;
    
    const currentWeight = parseFloat(actualWeight) || 0;
    const currentReps = parseInt(actualReps) || 0;
    const prevWeight = previousPerformance.weight || 0;
    const prevReps = previousPerformance.reps || 0;
    
    const currentVolume = currentWeight * currentReps;
    const prevVolume = prevWeight * prevReps;
    
    if (currentVolume > prevVolume) {
      return (
        <View style={styles.progressIndicator}>
          <TrendingUp size={14} color={colors.success} />
          <Text style={styles.progressText}>+{((currentVolume - prevVolume) / prevVolume * 100).toFixed(1)}%</Text>
        </View>
      );
    }
    
    return null;
  };

  if (currentSet.completed && !isEditing) {
    return (
      <View style={styles.completedSetContainer}>
        <View style={styles.completedSetHeader}>
          <CheckCircle2 size={20} color={colors.success} />
          <Text style={styles.completedSetTitle}>Set {setNumber} Completed</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Edit3 size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.completedSetDetails}>
          <Text style={styles.completedSetText}>
            {currentSet.actualReps} reps × {currentSet.actualWeight || 'bodyweight'} lbs
          </Text>
          {currentSet.actualRPE && (
            <Text style={styles.completedSetText}>RPE: {currentSet.actualRPE}/10</Text>
          )}
        </View>
        
        {currentSet.notes && (
          <Text style={styles.completedSetNotes}>{currentSet.notes}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.setInfo}>
          <Target size={18} color={colors.primary} />
          <Text style={styles.setTitle}>Set {setNumber}</Text>
        </View>
        {getProgressIndicator()}
      </View>

      {/* Target vs Previous Performance */}
      <View style={styles.targetRow}>
        <View style={styles.targetItem}>
          <Text style={styles.targetLabel}>Target</Text>
          <Text style={styles.targetValue}>
            {typeof currentSet.targetReps === 'string' ? currentSet.targetReps : `${currentSet.targetReps} reps`}
          </Text>
        </View>
        
        {previousPerformance && (
          <View style={styles.targetItem}>
            <Text style={styles.targetLabel}>Last Time</Text>
            <Text style={styles.previousValue}>
              {previousPerformance.reps} × {previousPerformance.weight || 'BW'} lbs
            </Text>
          </View>
        )}
      </View>

      {/* Input Fields */}
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps *</Text>
          <TextInput
            style={styles.input}
            value={actualReps}
            onChangeText={setActualReps}
            placeholder="0"
            keyboardType="numeric"
            maxLength={3}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (lbs)</Text>
          <TextInput
            style={styles.input}
            value={actualWeight}
            onChangeText={setActualWeight}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>RPE</Text>
          <TextInput
            style={styles.input}
            value={actualRPE}
            onChangeText={setActualRPE}
            placeholder="7"
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </View>

      {/* Notes Input */}
      <View style={styles.notesContainer}>
        <Text style={styles.inputLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="How did this set feel?"
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Complete Set Button */}
      <TouchableOpacity 
        style={styles.completeButton}
        onPress={handleCompleteSet}
      >
        <CheckCircle2 size={20} color="#FFFFFF" />
        <Text style={styles.completeButtonText}>Complete Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  setInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.success,
  },
  targetRow: {
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
  previousValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.2)',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'rgba(93, 95, 239, 0.2)',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  completedSetContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  completedSetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completedSetTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.success,
    flex: 1,
    marginLeft: 8,
  },
  editButton: {
    padding: 4,
  },
  completedSetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedSetText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  completedSetNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
});