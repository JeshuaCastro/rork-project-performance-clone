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
  CheckCircle,
  Info
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
  onDetails?: () => void;
}

export default function StrengthWorkoutCard({ 
  workout, 
  isCompleted, 
  onPress, 
  onStart, 
  onEdit,
  onDetails 
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
      {/* Header */}
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
        <View style={styles.headerActions}>
          <View style={[
            styles.intensityBadge,
            { backgroundColor: getIntensityColor(workout.intensity) }
          ]}>
            {getIntensityIcon(workout.intensity)}
            <Text style={styles.intensityText}>{workout.intensity}</Text>
          </View>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={(e) => {
              e.stopPropagation();
              if (onDetails) {
                onDetails();
              } else {
                onPress();
              }
            }}
          >
            <Info size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Essential info only */}
      <View style={styles.metaInfoRow}>
        {workout.duration && (
          <View style={styles.metaItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{workout.duration}</Text>
          </View>
        )}
        
        {workout.exercises && workout.exercises.length > 0 && (
          <View style={styles.metaItem}>
            <Target size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{workout.exercises.length} exercises</Text>
          </View>
        )}
        
        {isCompleted && (
          <View style={styles.completionIndicator}>
            <CheckCircle size={14} color={colors.success} />
            <Text style={styles.completionText}>Done</Text>
          </View>
        )}
      </View>
      
      {/* Action button */}
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
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  detailsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  workoutTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
    minWidth: 0,
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
    maxWidth: 90,
    justifyContent: 'center',
  },
  intensityText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  completionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completionText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600' as const,
    marginLeft: 3,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
});