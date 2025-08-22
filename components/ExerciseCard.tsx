import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { WorkoutExercise } from '@/types/exercises';
import { getExerciseById } from '@/constants/exerciseDatabase';
import { 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Info, 
  AlertTriangle, 
  Target,
  Clock,
  Dumbbell,
  CheckCircle2,
  Zap
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showModifications, setShowModifications] = useState(false);
  
  const exercise = getExerciseById(workoutExercise.exerciseId);
  
  if (!exercise) {
    return (
      <View style={styles.errorCard}>
        <Text style={styles.errorText}>Exercise not found: {workoutExercise.exerciseId}</Text>
      </View>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  const getMuscleGroupIcon = (muscles: string[]) => {
    if (muscles.includes('cardio')) return <Zap size={16} color={colors.primary} />;
    if (muscles.includes('core')) return <Target size={16} color={colors.primary} />;
    return <Dumbbell size={16} color={colors.primary} />;
  };

  const formatSetsReps = () => {
    const parts = [];
    if (workoutExercise.sets) parts.push(`${workoutExercise.sets} sets`);
    if (workoutExercise.reps) parts.push(`${workoutExercise.reps} reps`);
    if (workoutExercise.duration) parts.push(workoutExercise.duration);
    return parts.join(' × ') || 'As prescribed';
  };

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {getMuscleGroupIcon(exercise.primaryMuscles)}
          <View style={styles.titleText}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <View style={styles.metaInfo}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(exercise.difficulty) }]}>
                  {exercise.difficulty}
                </Text>
              </View>
              <Text style={styles.muscleGroups}>
                {exercise.primaryMuscles.join(', ')}
              </Text>
            </View>
          </View>
        </View>
        
        {showDetails && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 
              <ChevronUp size={20} color={colors.textSecondary} /> : 
              <ChevronDown size={20} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Exercise Prescription */}
      <View style={styles.prescriptionContainer}>
        <Text style={styles.prescriptionText}>{formatSetsReps()}</Text>
        {workoutExercise.weight && (
          <Text style={styles.weightText}>Weight: {workoutExercise.weight}</Text>
        )}
        {workoutExercise.restTime && (
          <Text style={styles.restText}>Rest: {workoutExercise.restTime}</Text>
        )}
        {workoutExercise.targetRPE && (
          <Text style={styles.rpeText}>Target RPE: {workoutExercise.targetRPE}/10</Text>
        )}
      </View>

      {/* Quick Description */}
      <Text style={styles.description}>{exercise.description}</Text>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isCompleted ? (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={onStart}
          >
            <Play size={16} color={colors.text} />
            <Text style={styles.startButtonText}>Start Exercise</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedButton}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={styles.completedButtonText}>Completed</Text>
          </View>
        )}
        
        {showDetails && (
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Info size={16} color={colors.textSecondary} />
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expanded Details */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Equipment Needed */}
          {exercise.equipment.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Equipment Needed</Text>
              <View style={styles.equipmentList}>
                {exercise.equipment.map((item, index) => (
                  <View key={index} style={styles.equipmentItem}>
                    <Text style={styles.equipmentText}>
                      {item.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick Form Tips */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Key Form Tips</Text>
            {exercise.formTips.slice(0, 3).map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Instructions Toggle */}
          <TouchableOpacity 
            style={styles.toggleButton}
            onPress={() => setShowInstructions(!showInstructions)}
          >
            <Text style={styles.toggleButtonText}>
              {showInstructions ? 'Hide' : 'Show'} Step-by-Step Instructions
            </Text>
            {showInstructions ? 
              <ChevronUp size={16} color={colors.primary} /> : 
              <ChevronDown size={16} color={colors.primary} />
            }
          </TouchableOpacity>

          {/* Step-by-Step Instructions */}
          {showInstructions && (
            <View style={styles.instructionsContainer}>
              {exercise.instructions.map((step, index) => (
                <View key={index} style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepInstruction}>{step.instruction}</Text>
                    {step.tip && (
                      <Text style={styles.stepTip}>💡 {step.tip}</Text>
                    )}
                    {step.commonMistake && (
                      <Text style={styles.stepMistake}>⚠️ Avoid: {step.commonMistake}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Modifications Toggle */}
          {exercise.modifications.length > 0 && (
            <>
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => setShowModifications(!showModifications)}
              >
                <Text style={styles.toggleButtonText}>
                  {showModifications ? 'Hide' : 'Show'} Modifications
                </Text>
                {showModifications ? 
                  <ChevronUp size={16} color={colors.primary} /> : 
                  <ChevronDown size={16} color={colors.primary} />
                }
              </TouchableOpacity>

              {showModifications && (
                <View style={styles.modificationsContainer}>
                  {exercise.modifications.map((mod, index) => (
                    <View key={index} style={styles.modificationItem}>
                      <View style={[
                        styles.modificationBadge,
                        { backgroundColor: mod.level === 'easier' ? colors.success + '20' : colors.warning + '20' }
                      ]}>
                        <Text style={[
                          styles.modificationLevel,
                          { color: mod.level === 'easier' ? colors.success : colors.warning }
                        ]}>
                          {mod.level === 'easier' ? 'Easier' : 'Harder'}
                        </Text>
                      </View>
                      <Text style={styles.modificationName}>{mod.description}</Text>
                      <Text style={styles.modificationInstruction}>{mod.instruction}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Safety Notes */}
          {exercise.safetyNotes.length > 0 && (
            <View style={styles.safetySection}>
              <View style={styles.safetySectionHeader}>
                <AlertTriangle size={16} color={colors.warning} />
                <Text style={styles.safetySectionTitle}>Safety Notes</Text>
              </View>
              {exercise.safetyNotes.map((note, index) => (
                <View key={index} style={styles.safetyItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.safetyText}>{note}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Exercise Stats */}
          <View style={styles.statsContainer}>
            {exercise.estimatedDuration && (
              <View style={styles.statItem}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{exercise.estimatedDuration}</Text>
              </View>
            )}
            {exercise.caloriesPerMinute && (
              <View style={styles.statItem}>
                <Zap size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{exercise.caloriesPerMinute} cal/min</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Notes */}
      {workoutExercise.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Notes:</Text>
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
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  completedCard: {
    borderColor: colors.success + '30',
    backgroundColor: colors.success + '05',
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
  exerciseName: {
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
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 2,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  muscleGroups: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  expandButton: {
    padding: 4,
  },
  prescriptionContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  prescriptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  weightText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  restText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  rpeText: {
    fontSize: 14,
    color: colors.warning,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
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
    backgroundColor: colors.success + '20',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  completedButtonText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 16,
    marginTop: 4,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  equipmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  equipmentItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  equipmentText: {
    fontSize: 12,
    color: colors.text,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  instructionsContainer: {
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  stepTip: {
    fontSize: 13,
    color: colors.success,
    lineHeight: 18,
    marginBottom: 2,
  },
  stepMistake: {
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
  },
  modificationsContainer: {
    marginBottom: 16,
  },
  modificationItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  modificationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  modificationLevel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modificationName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  modificationInstruction: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  safetySection: {
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  safetySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 6,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  notesContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});