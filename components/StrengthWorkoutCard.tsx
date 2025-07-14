import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { 
  Dumbbell, 
  Clock, 
  Target, 
  ArrowRight, 
  Check, 
  Edit3, 
  Eye,
  Weight,
  Zap,
  BarChart3,
  CheckCircle
} from 'lucide-react-native';

interface Exercise {
  name: string;
  sets?: string;
  reps?: string;
  duration?: string;
  notes?: string;
}

interface StrengthWorkout {
  day: string;
  title: string;
  description: string;
  intensity: string;
  adjustedForRecovery: string | null;
  type: 'strength';
  completed?: boolean;
  duration?: string;
  equipment?: string[];
  exercises?: Exercise[];
  tips?: string[];
  modifications?: string[];
  targetMuscleGroups?: string[];
  estimatedWeight?: string;
  restPeriods?: string;
}

interface StrengthWorkoutCardProps {
  workout: StrengthWorkout;
  isCompleted: boolean;
  onPress: () => void;
  onStart: () => void;
  onEdit: () => void;
}

export default function StrengthWorkoutCard({ 
  workout, 
  isCompleted, 
  onPress, 
  onStart, 
  onEdit 
}: StrengthWorkoutCardProps) {
  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high':
        return '#FF6B6B';
      case 'medium-high':
        return '#FFB347';
      case 'medium':
        return colors.primary;
      case 'medium-low':
      case 'low':
        return '#4ECDC4';
      default:
        return colors.textSecondary;
    }
  };

  const getIntensityIcon = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high':
        return <Zap size={14} color="#FF6B6B" />;
      case 'medium-high':
        return <BarChart3 size={14} color="#FFB347" />;
      case 'medium':
        return <Target size={14} color={colors.primary} />;
      case 'medium-low':
      case 'low':
        return <Weight size={14} color="#4ECDC4" />;
      default:
        return <Target size={14} color={colors.textSecondary} />;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.workoutCard, isCompleted && styles.completedCard]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with strength-specific styling */}
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleContainer}>
          <View style={styles.strengthIconContainer}>
            <Dumbbell size={18} color={colors.text} />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.workoutTitle} numberOfLines={1} ellipsizeMode="tail">
              {workout.title}
            </Text>
            <Text style={styles.workoutType}>Strength Training</Text>
          </View>
        </View>
        <View style={[
          styles.intensityBadge,
          { backgroundColor: getIntensityColor(workout.intensity) }
        ]}>
          {getIntensityIcon(workout.intensity)}
          <Text style={styles.intensityText}>{workout.intensity}</Text>
        </View>
      </View>
      
      {/* Strength-specific info */}
      <View style={styles.strengthInfo}>
        {workout.targetMuscleGroups && workout.targetMuscleGroups.length > 0 && (
          <View style={styles.muscleGroupsContainer}>
            <Text style={styles.muscleGroupsLabel}>Target:</Text>
            <Text style={styles.muscleGroupsText} numberOfLines={1}>
              {workout.targetMuscleGroups.join(', ')}
            </Text>
          </View>
        )}
        
        {workout.exercises && workout.exercises.length > 0 && (
          <View style={styles.exercisePreview}>
            <Text style={styles.exerciseCount}>
              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.exercisePreviewText} numberOfLines={1}>
              {workout.exercises.slice(0, 2).map(ex => ex.name).join(', ')}
              {workout.exercises.length > 2 ? '...' : ''}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.workoutDescription} numberOfLines={2} ellipsizeMode="tail">
        {workout.description}
      </Text>
      
      {/* Strength-specific metadata */}
      <View style={styles.metaInfoRow}>
        {workout.duration && (
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{workout.duration}</Text>
          </View>
        )}
        
        {workout.estimatedWeight && (
          <View style={styles.metaItem}>
            <Weight size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{workout.estimatedWeight}</Text>
          </View>
        )}
        
        {workout.restPeriods && (
          <View style={styles.metaItem}>
            <Target size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{workout.restPeriods} rest</Text>
          </View>
        )}
      </View>
      
      {workout.equipment && workout.equipment.length > 0 && (
        <View style={styles.equipmentContainer}>
          <Text style={styles.equipmentLabel}>Equipment:</Text>
          <Text style={styles.equipmentText} numberOfLines={1}>
            {workout.equipment.join(', ')}
          </Text>
        </View>
      )}
      
      {workout.adjustedForRecovery && (
        <View style={styles.adjustmentContainer}>
          <Text style={styles.adjustmentTitle}>Recovery Adjustment:</Text>
          <Text style={styles.adjustmentText} numberOfLines={2} ellipsizeMode="tail">
            {workout.adjustedForRecovery}
          </Text>
        </View>
      )}
      
      {/* Action buttons */}
      <View style={styles.workoutButtonsRow}>
        <TouchableOpacity 
          style={[
            styles.startWorkoutButton,
            isCompleted && styles.completedWorkoutButton
          ]}
          onPress={(e) => {
            e.stopPropagation();
            if (!isCompleted) {
              onStart();
            }
          }}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={[styles.startWorkoutText, { color: '#FFFFFF' }]}>Completed</Text>
            </>
          ) : (
            <>
              <Text style={styles.startWorkoutText}>Start Lifting</Text>
              <ArrowRight size={18} color={colors.text} />
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.editWorkoutButton}
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit3 size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.clickHint}>
        <Eye size={14} color={colors.textSecondary} />
        <Text style={styles.clickHintText}>Tap for exercise details</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedCard: {
    opacity: 0.7,
    borderLeftColor: colors.success,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  strengthIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(93, 95, 239, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  workoutType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  intensityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  intensityText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  strengthInfo: {
    marginBottom: 8,
  },
  muscleGroupsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  muscleGroupsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600' as const,
    marginRight: 6,
  },
  muscleGroupsText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  exercisePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  exercisePreviewText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  workoutDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  equipmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600' as const,
    marginRight: 6,
  },
  equipmentText: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  adjustmentContainer: {
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  adjustmentTitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  adjustmentText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  workoutButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  completedWorkoutButton: {
    backgroundColor: '#22C55E',
  },
  startWorkoutText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
    marginRight: 4,
  },
  editWorkoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickHintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});